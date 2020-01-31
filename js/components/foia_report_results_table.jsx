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
    const sampleData = [
      { id: 1, agency: 'Administrative Conference of the United States', component: 'asdf', fiscalYear: '2017' },
      { id: 2, agency: 'Central Intelligence Agency', component: 'asdf' , fiscalYear: '2016' },
      { id: 3, agency: 'Department of Agriculture', component: 'asdf', fiscalYear: '2014' },
    ];
    const sampleColumns = [
      { title: 'Compare', formatter: 'rowSelection', align: 'center', headerSort: false, cellClick: function(e, cell) { cell.getRow().toggleSelect(); } },
      { title: 'Agency', field: 'agency', width: 150 },
      { title: 'Component', field: 'component', align: 'left' },
      { title: 'Fiscal year', field: 'fiscalYear' },
    ];

    this.tableData = sampleData;
    this.tableColumns = sampleColumns;
    this.tabulator = new Tabulator(this.element, {
      data: this.tableData,
      columns: this.tableColumns,
      reactiveData: true,
    });
  }

  render() {
    return (<div ref={(ref) => { this.element = ref; }} />);
  }
}

export default FoiaReportResultsTable;
