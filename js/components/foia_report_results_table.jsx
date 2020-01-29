/*
 * HTML table
 *
 */

import React, { Component, createRef } from 'react';
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
