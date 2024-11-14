/* eslint-disable class-methods-use-this */
import { Registry } from './registry.js';

function _details(item) {
    let place = '';
    if (item.place.name.de && item.place.name.de.length > 0) {
      place = item.place.name.de;
    }
    let gnd = '';
    if (item.gnd && item.gnd.length > 0) {
      gnd = 'GND: '.concat(item.gnd);
    }
     return `${place.concat(' ', gnd)}`;
    }
    
/**
 * Uses https://fpb.saw-leipzig.de/api to query FPB
 */
export class FPB_Institutions extends Registry {
  
  query(key) {
    const results = [];
    return new Promise((resolve) => {
        fetch(`https://fpb.saw-leipzig.de/api/places/institution/search/?q=${key}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject();
        })
        .then((json) => {
            console.log("JSON Inst", json);
            json.institutions.forEach((item) => { 
                console.log("JSON item", item);             
            const result = {
                register: this._register,
                id: (this._prefix ? `${this._prefix}-${item.uuid}` : item.uuid),
                label: item.name.de,
                link: `https://fpb.saw-leipzig.de/places/institution/${encodeURIComponent(item.uuid)}`,
                details: _details(item),
                strings: item.name.de,
                provider: 'FPB_Institutions'
            };
            results.push(result);
            });
            resolve({
                totalItems: json.totalItems,
                items: results,
            });
        })
    })
  }

  /**
   * Retrieve a raw JSON record for the given key as returned by the endpoint.
   *
   * @param {string} key the key to look up
   * @returns {Promise<any>} promise resolving to the JSON record returned by the endpoint
   */
  async getRecord(key) {
    const id = this._prefix ? key.substring(this._prefix.length + 1) : key;
    return fetch(`https://fpb.saw-leipzig.de/api/places/institution/${encodeURIComponent(id)}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        console.log("JSON Inst2", json);
        const output = Object.assign({}, json);
        output.name = json.name.de;
        output.link = json.uuid;
        if (json.place.name.de && json.place.name.de.length > 0) {
            output.place = json.place.name.de;
          }
        if (json.latitude && json.latitude.toString() > 0) {
            output.lat = json.latitude.toString();
          }
          if (json.longitude && json.longitude.toString() > 0) {
            output.lng = json.longitude.toString();
          }
          if (json.geonames && json.geonames.toString() > 0) {
            output.geonames = json.geonames.toString();
          }
          if (json.rism && json.rism.length > 0) {
              output.rism = json.rism;
          }
          if (json.viaf && json.viaf.length > 0) {
              output.viaf = json.viaf;
          }
          if (json.isil && json.isil.length > 0) {
              output.isil = json.isil;
          }
          if (json.gnd && json.gnd.length > 0) {
              output.gnd = json.gnd;
          }
        return output;
      })
      .catch(() => Promise.reject());
  }

  info(key, container) {
    if (!key) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.getRecord(key)
      .then((json) => {   
        let info = this.infoInstitution(json);
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/places/institution/${encodeURIComponent(json.uuid)}" target="_blank"> ${json.name.concat(' (', json.place, ')')} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.uuid}` : json.uuid,
          strings: json.name.de
        });
      })
      .catch(() => reject());
    });
  }

  infoInstitution(json) {
    console.log("Last", json);
    const rism = json.rism ? json.rism : 'Ohne RISM-Sigel';
    return `<p>${rism}</p>`;
  }
}
