import React, { Component } from 'react';
// import PropTypes from 'prop-types';
//
// import dispatcher from '../util/dispatcher';
import { reportActions } from '../actions/report';
import PropTypes from 'prop-types';
import { List } from 'immutable';

class FoiaReportDataSubmit extends Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    reportActions.fetchAnnualReportData(['group_v_a_foia_requests_received', 'group_iv_exemption_3_statutes']);
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
