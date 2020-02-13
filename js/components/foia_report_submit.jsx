import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { reportActions } from '../actions/report';
import agencyComponentStore from '../stores/agency_component';
import { List } from 'immutable';

class FoiaReportDataSubmit extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDownloadCSV = this.handleDownloadCSV.bind(this);
    this.formIsValid = this.formIsValid.bind(this);
  }

  formIsValid() {
    const validationFieldCheck = [
      this.props.agencyComponentIsValid,
      this.props.dataTypesIsValid,
      this.props.fiscalYearsIsValid,
    ];

    return validationFieldCheck.every(Boolean);
  }

  handleSubmit(event) {
    reportActions.returnFieldValidationStateOnSubmit();
    if (this.formIsValid()) {
      reportActions.fetchAnnualReportData(this.props.selectedDataTypes);
    } else {
      event.preventDefault();
    }
  }

  handleDownloadCSV(event) {
    event.preventDefault();
    reportActions.returnFieldValidationStateOnSubmit();
    if (this.formIsValid()) {
      this.props.onClick(event);
    }
  }

  getSelectedAgencies() {
    if (!this.props.allAgenciesSelected) {
      return this.props.selectedAgencies;
    }

    // If all agencies are selected, get an array of all agencies
    // where the only component is an overall component.
    let { agencies } = agencyComponentStore.getState();
    agencies = agencies.map((agency) => (
      Object.assign({}, agency, {
        components: List([{
          abbreviation: 'Agency Overall',
          id: `overall:${agency.id}`,
          isOverall: true,
          selected: true,
        }]),
      })
    ));

    return agencies.toArray();
  }

  render() {
    return (
      <div className="form-group form-group_footer">
        <button onClick={this.handleSubmit} type="submit" className="usa-button usa-button-big usa-button-primary-alt with-siblings">View Report</button>
        <button onClick={this.handleDownloadCSV} type="button" className="usa-button usa-button-big usa-button-outline">Download CSV</button>
        <a>Clear Search</a>
      </div>
    );
  }
}

FoiaReportDataSubmit.propTypes = {
  allAgenciesSelected: PropTypes.bool,
  selectedAgencies: PropTypes.array,
  selectedDataTypes: PropTypes.array,
  fiscalYearsIsValid: PropTypes.bool.isRequired,
  dataTypesIsValid: PropTypes.bool.isRequired,
  agencyComponentIsValid: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

FoiaReportDataSubmit.defaultProps = {
  allAgenciesSelected: false,
  selectedAgencies: [],
  selectedDataTypes: [],
};

export default FoiaReportDataSubmit;
