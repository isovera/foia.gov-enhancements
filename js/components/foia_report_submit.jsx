import React, { Component } from 'react';
// import PropTypes from 'prop-types';
//
// import dispatcher from '../util/dispatcher';
import { reportActions } from '../actions/report';
import PropTypes from 'prop-types';
import { List } from 'immutable';

class FoiaReportDataSubmit extends Component {
  // constructor(props) {
  //   super(props);
  //   this.handleChange = this.handleChange.bind(this);
  // }

  componentDidMount() {
    reportActions.fetchAnnualReportData(['group_v_a_foia_requests_received', 'group_overall_vb1_main']);
  }
  // static getSections() {
  //   reportActions.fetchAnnualReportData(['group_v_a_foia_requests_received']);
  // }

  // handleChange() {
  //   const report = this.props.report = 'f';
  // }

  render() {
    return (
      <div>f</div>
    );
  }
}

// FoiaReportDataSubmit.propTypes = {
//   report: PropTypes.any,
// };
//
// FoiaReportDataSubmit.defaultProps = {
//   report: 'none',
// };


export default FoiaReportDataSubmit;
