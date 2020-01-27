/*
 * HTML table
 *
 */

import React, { Component } from 'react';

class Table extends Component {
  render() {
    return (
      <table className="responsive-data-table">
        <thead>
          <tr>
            <th>One</th>
            <th>Two</th>
            <th>Three</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td />
            <td />
            <td />
          </tr>
        </tbody>
      </table>
    );
  }
}

export default Table;
