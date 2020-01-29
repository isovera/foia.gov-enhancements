/*
 * HTML table
 *
 */

import React, { Component, createRef } from 'react';
import Tabulator from 'tabulator-tables';

class FoiaReportResultsTable extends Component {
  constructor() {
    super();

    this.tabulatorElement = null;
    this.tabulator = null;
    this.tableData = [];
  }

  componentDidMount() {
    this.tabulator = new Tabulator(this.el, {
      data: this.tableData,
      reactiveData:true,
      columns: [],
    });
  }

  render() {
    return (<div ref={el => (this.el = el)} />);
  }
}

export default FoiaReportResultsTable;
