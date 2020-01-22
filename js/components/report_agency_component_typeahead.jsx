import { Map, List } from 'immutable';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { uniqueId } from 'lodash';

import tokenizers from '../util/tokenizers';


// Only load typeahead in the browser (avoid loading it for tests)
let Bloodhound;
if (typeof window !== 'undefined') {
  Bloodhound = require('typeahead.js/dist/bloodhound'); // eslint-disable-line global-require
  require('typeahead.js/dist/typeahead.jquery'); // eslint-disable-line global-require
}


// Expects agencies as a sequence type
function datums({ agencies, agencyComponents }) {
  // Keep an index of centralized agencies for quick lookup
  const centralizedAgencyIndex = {};

  return agencies
    .map((agency) => {
      if (agency.isCentralized()) {
        // Warning: Side-effect
        // Add the agency to the index of centralized agencies
        centralizedAgencyIndex[agency.id] = true;
      }

      // Add a title property for common displayKey
      return Object.assign(agency.toJS(), { title: agency.name });
    })
    .toJS()
    // Include decentralized agency components in typeahead
    .concat(
      agencyComponents.toJS().filter(
        agencyComponent => !(agencyComponent.agency.id in centralizedAgencyIndex),
      ),
    );
}


class ReportAgencyComponentTypeahead extends Component {
  constructor(props) {
    super(props);

    this.isIndexed = false;
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillMount() {
    this.setState({
      id: uniqueId(),
    });
  }

  componentDidMount() {
    this.bloodhound = new Bloodhound({
      local: [],
      sorter: (a, b) => {
        // Ensure that agencies come before components and vice versa.
        if (a.type === 'agency' && b.type !== 'agency') {
          return -1;
        }
        if (a.type !== 'agency' && b.type === 'agency') {
          return 1;
        }
        // Otherwise sort by title/name.
        const aName = (a.type === 'agency') ? a.name : a.title;
        const bName = (b.type === 'agency') ? b.name : b.title;
        if (aName < bName) {
          return -1;
        } else if (aName > bName) {
          return 1;
        }
        return 0;
      },
      identify: datum => datum.id,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      datumTokenizer: datum => (
        datum.type === 'agency' ?
          (
            // For agencies
            []
              .concat(Bloodhound.tokenizers.nonword(datum.name))
              .concat(Bloodhound.tokenizers.whitespace(datum.abbreviation))
          ) : (
            // For agency components
            []
              .concat(Bloodhound.tokenizers.nonword(datum.title))
              .concat(
                datum.abbreviation ?
                  Bloodhound.tokenizers.whitespace(datum.abbreviation) :
                  tokenizers.firstLetterOfEachCapitalizedWord(datum.title),
              )
              .concat(Bloodhound.tokenizers.whitespace(datum.agency.name))
              .concat(Bloodhound.tokenizers.whitespace(datum.agency.abbreviation))
          )
      ),
    });

    // If we have all the data already then index it. If we're still waiting on
    // data, we'll index when we receive the complete props.
    if (this.props.agencyFinderDataComplete) {
      this.index(this.props);
    }

    // Initialize the typeahead input element
    if (!this.typeaheadInput) {
      return;
    }

    function display(datum) {
      return datum.agency ? `${datum.title} (${datum.agency.name})` : datum.title;
    }

    this.typeahead = $(this.typeaheadInput).typeahead({
      highlight: true,
      hint: false,
    }, {
      name: 'agencies',
      display,
      source: this.bloodhound.ttAdapter(),
      templates: {
        suggestion: datum =>
          $('<div>').addClass(datum.type).text(display(datum)),
      },
    })
      .bind('typeahead:select', (e, suggestion) => this.handleChange(suggestion));
  }

  componentWillReceiveProps(nextProps) {
    // Indexing the typeahead is expensive and if we do it in batches, it gets
    // complicated to calculate which agencies are centralized vs
    // decentralized. Wait until we've received all the agency finder data
    // before indexing.
    if (!nextProps.agencyFinderDataComplete) {
      return;
    }

    this.index(nextProps);
  }

  index(props) {
    if (this.isIndexed) {
      return;
    }

    // There is no update, only initialize. We assume that the component is only
    // initialized after all the data is ready. Any updates are not significant
    // enough to warrant an update. We only need title and abbreviation to
    // render which should be available once the agency finder data fetch is
    // complete.
    this.isIndexed = true;
    const { agencies, agencyComponents } = props;

    this.bloodhound.clear(); // Just in case
    this.bloodhound.add(datums({
      agencies: agencies.valueSeq(), // Pull the values, convert to sequence
      agencyComponents,
    }));
  }

  handleChange(selection) {
    this.props.onAgencyChange(selection);
  }

  render() {
    const { agencyFinderDataProgress } = this.props;
    const loading = !this.props.agencyFinderDataComplete;

    return (
      <div role="search">
        <label className="usa-sr-only" htmlFor={`agency-component-search-${this.state.id}`}>Search for an agency</label>
        <input
          type="text"
          id={`agency-component-search-${this.state.id}`}
          name="agency_component_search"
          placeholder={loading ? `Loading… ${agencyFinderDataProgress}%` : 'Type agency name'}
          disabled={loading}
          ref={(input) => {
            this.typeaheadInput = input;
          }}
        />
      </div>
    );
  }
}

ReportAgencyComponentTypeahead.propTypes = {
  /* eslint-disable react/no-unused-prop-types */
  agencies: PropTypes.instanceOf(Map),
  agencyComponents: PropTypes.instanceOf(List),
  /* eslint-enable react/no-unused-prop-types */
  onAgencyChange: PropTypes.func.isRequired,
  agencyFinderDataComplete: PropTypes.bool.isRequired,
  agencyFinderDataProgress: PropTypes.number,
};

ReportAgencyComponentTypeahead.defaultProps = {
  agencies: new Map(),
  agencyComponents: new List(),
  agencyFinderDataProgress: 0,
};

export default ReportAgencyComponentTypeahead;