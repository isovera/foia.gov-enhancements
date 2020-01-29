import { List } from 'immutable';
import { Store } from 'flux/utils';
import dispatcher from '../util/dispatcher';


class AnnualReportStore extends Store {
  constructor(_dispatcher) {
    super(_dispatcher);

    this.state = {
      reports: new List(),
    };
  }

  getState() {
    return this.state;
  }

  __onDispatch(payload) {
    switch (payload.type) {
      default:
        break;
    }
  }
}

const annualReportStore = new AnnualReportStore(dispatcher);

export default annualReportStore;

export {
  AnnualReportStore,
};
