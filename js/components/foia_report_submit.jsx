import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { List } from 'immutable';
import { reportActions, types } from '../actions/report';
import dispatcher from '../util/dispatcher';
import annualReportDataFormStore from '../stores/annual_report_data_form';

class FoiaReportDataSubmit extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
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
    event.preventDefault();
    const action = event.target.value;
    reportActions.returnFieldValidationStateOnSubmit();
    if (this.formIsValid()) {
      dispatcher.dispatch({
        type: types.REPORT_SUBMISSION_TYPE,
        submissionAction: action,
      });
      reportActions.fetchAnnualReportData((builder) => {
        const selectedAgencies = annualReportDataFormStore.getSelectedAgencies();
        const agencies = selectedAgencies.filter(selection => selection.type === 'agency');
        const components = selectedAgencies.filter(selection => selection.type === 'agency_component');
        const includeOverall = agencies.filter((agency) => {
          const overall = agency
            .components
            .filter(component => component.selected && component.isOverall);

          return List.isList(overall) ? overall.size > 0 : overall.length > 0;
        }).length > 0;


        return builder
          .includeSections(this.props.selectedDataTypes, includeOverall)
          .addOrganizationsGroup({
            agencies: agencies.map(agency => agency.abbreviation),
            components: components.map(component => component.abbreviation),
          });
      });
    }
  }

  render() {
    return (
      <div className="form-group form-group_footer">
        <button onClick={this.handleSubmit} value="view" type="submit" className="usa-button usa-button-big usa-button-primary-alt with-siblings">View Report</button>
        <button onClick={this.handleSubmit} value="download" type="button" className="usa-button usa-button-big usa-button-outline">Download CSV</button>
        <a>Clear Search</a>
      </div>
    );
  }
}

FoiaReportDataSubmit.propTypes = {
  selectedDataTypes: PropTypes.array,
  selectedFiscalYears: PropTypes.array,
  fiscalYearsIsValid: PropTypes.bool.isRequired,
  dataTypesIsValid: PropTypes.bool.isRequired,
  agencyComponentIsValid: PropTypes.bool.isRequired,
};

FoiaReportDataSubmit.defaultProps = {
  selectedDataTypes: [],
  selectedFiscalYears: [],
};

export default FoiaReportDataSubmit;
