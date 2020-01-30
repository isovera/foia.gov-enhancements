/*
 * HTML table
 *
 */

import React, { Component } from 'react';
import Tabulator from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';

class FoiaReportResultsTable extends Component {
  constructor() {
    super();

    this.tabulatorElement = null;
    this.tabulator = null;
    this.tableData = [];
    this.columns = [];
  }

  componentDidMount() {
    this.tabulator = new Tabulator(this.element, {
      data: this.tableData,
      reactiveData:true,
      columns: [],
    });
  }

  render() {
    return (<div ref={(ref) => { this.element = ref; }} />);
  }
}

export default FoiaReportResultsTable;
