import { Metagrid } from './metagrid.js';
import { GeoNames } from './geonames.js';
import { Airtable } from './airtable.js';
import { GND } from './gnd.js';
import { FPB_Persons } from './fpb_persons.js';
import { FPB_Places } from './fpb_places.js';
import { FPB_Institutions } from './fpb_institutions.js';
import { FPB_Glossary } from './fpb_glossary.js';
import { KBGA } from './kbga.js';
import { Anton } from './anton.js';
// import { ReconciliationService } from './reconciliation.js';
import { Custom } from './custom.js';

export function createConnectors(endpoint, root) {
  const authorities = [];
  root.querySelectorAll(':scope > pb-authority').forEach(configElem => {
    const connector = configElem.getAttribute('connector');
    let instance;
    switch (connector) {
      case 'GND':
        instance = new GND(configElem);
        break;
      case 'GeoNames':
        instance = new GeoNames(configElem);
        break;
      case 'FPB_Persons':
        instance = new FPB_Persons(configElem);
        break;
      case 'FPB_Places':
        instance = new FPB_Places(configElem);
        break;
      case 'FPB_Institutions':
        instance = new FPB_Institutions(configElem);
        break;
      case 'FPB_Glossary':
        instance = new FPB_Glossary(configElem);
        break;
      case 'Airtable':
        instance = new Airtable(configElem);
        break;
      case 'KBGA':
        instance = new KBGA(configElem);
        break;
      case 'Anton':
      case 'GF':
        instance = new Anton(configElem);
        break;
      // case 'ReconciliationService':
      //   instance = new ReconciliationService(configElem);
      //   break;
      case 'Custom':
        instance = new Custom(endpoint, configElem);
        break;
      default:
        instance = new Metagrid(configElem);
        break;
    }
    authorities.push(instance);
  });
  return authorities;
}
