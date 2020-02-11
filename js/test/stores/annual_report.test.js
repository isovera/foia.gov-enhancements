import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { Map } from 'immutable';

import annualReportStore, { AnnualReportStore } from '../../stores/annual_report';

chai.use(sinonChai);


describe('FoiaAnnualReportRequestBuilder', () => {
  let sandbox;
  const reports = new Map({
    test_report_1: new Map({
      title: 'Test Report 1',
      field_agency: {
        abbreviation: 'TEST_AGENCY_ABBREVIATION',
      },
      field_foia_annual_report_yr: 2018,
      field_test_component: [{
        field_agency_component: {
          abbreviation: 'TEST_COMPONENT',
        },
        field_test_field: 'TEST_FIELD_VALUE',
      }],
    }),
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(AnnualReportStore.prototype, 'getState').returns({ reports });
    sandbox.stub(annualReportStore, 'state').value({ reports });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('::getAgency', () => {
    it('retrieves an agency abbreviation from a report in the store', () => {
      expect(annualReportStore.getAgency('test_report_1'), 'agency abbreviation').to.equal('TEST_AGENCY_ABBREVIATION');
    });
    it('returns false if no report by the given id exists', () => {
      expect(annualReportStore.getAgency('non_existent_report_id'), 'agency abbreviation').to.equal(false);
    });
  });

  describe('::getFiscalYear', () => {
    it('retrieves the fiscal year from a report in the store', () => {
      expect(annualReportStore.getFiscalYear('test_report_1'), 'fiscal year').to.equal(2018);
    });
    it('returns false if no report by the given id exists', () => {
      expect(annualReportStore.getFiscalYear('non_existent_report_id'), 'fiscal year').to.equal(false);
    });
  });

  describe('::getComponentAbbreviation', () => {
    it('retrieves a component abbreviation given a component', () => {
      const report = annualReportStore.getReport('test_report_1');
      expect(
        AnnualReportStore.getComponentAbbreviation(
          report.get('field_test_component')[0],
        ), 'component abbreviation').to.equal('TEST_COMPONENT');
    });
    it('returns false if the agency component or abbreviation fields do not exist ', () => {
      const report = annualReportStore.getReport('test_report_1');
      expect(AnnualReportStore.getComponentAbbreviation(
        report.get('non_existent_component'),
      ), 'component_abbreviation').to.equal(false);
    });
  });

  describe('::appendReportData', () => {
    it('adds report values to component objects', () => {
      const component = annualReportStore.getReport('test_report_1').get('field_test_component')[0];
      expect(annualReportStore.appendReportData(component, 'test_report_1'), 'component & report data')
        .to
        .include({
          field_test_field: 'TEST_FIELD_VALUE',
          agency: 'TEST_AGENCY_ABBREVIATION',
          component: 'TEST_COMPONENT',
          fiscalYear: 2018,
        });
    });

    it('defaults to the value "Agency Overall" if the field_agency_component field does not exist in the given row', () => {
      const component = {
        overall_field: 'OVERALL FIELD VALUE',
      };
      expect(annualReportStore.appendReportData(component, 'test_report_1'), 'overall component & report data')
        .to
        .include({
          overall_field: 'OVERALL FIELD VALUE',
          agency: 'TEST_AGENCY_ABBREVIATION',
          component: 'Agency Overall',
          fiscalYear: 2018,
        });
    });
  });
});
