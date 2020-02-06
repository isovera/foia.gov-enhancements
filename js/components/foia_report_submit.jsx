import React, { Component } from 'react';
import annualReportDataFormStore from '../stores/annual_report_data_form';
import { reportActions } from '../actions/report';

class FoiaReportDataSubmit extends Component {
  constructor(props) {
    super(props);
    this.getSections = this.getSections.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  getSections() {
    const selectedDataTypes = annualReportDataFormStore.state.selectedDataTypes;
    const sections = [];
    if (selectedDataTypes.length > 0) {
      selectedDataTypes.forEach((item) => {
        sections.push(item.id);
      });
    }
    return sections;
  }

  handleSubmit(e) {
    e.preventDefault();
    reportActions.fetchAnnualReportData(this.getSections());
  }

  render() {
    return (
      <div className="form-group form-group_footer">
        <button onClick={this.handleSubmit} className="usa-button usa-button-big usa-button-primary-alt">View Report</button>
        <button onClick="" className="usa-button usa-button-big usa-button-outline">Download CSV</button>
        <a>Clear Search</a>
      </div>
    );
  }
}

export default FoiaReportDataSubmit;
