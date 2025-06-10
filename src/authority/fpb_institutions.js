/* eslint-disable class-methods-use-this */
import { Registry } from './registry.js';

function _details(item) {
    let place = '';
    if (item.place.name && item.place.name.de != null) {
      place = item.place.name.de;
    }
    let gnd = '';
    if (item.gnd && item.gnd.value != null) {
      gnd = 'GND: '.concat(item.gnd.value);
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
            json.institutions.forEach((item) => {          
            const result = {
                register: this._register,
                id: (this._prefix ? `${this._prefix}-${item.pid}` : item.pid),
                label: item.name.de,
                link: `https://fpb.saw-leipzig.de/places/institution/${encodeURIComponent(item.pid)}`,
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
        const output = Object.assign({}, json);
        output.name = json.name[0].value;
        output.link = json.pid;
        if (json.place.name[0] && json.place.name[0].value != null) {
            output.place = json.place.name[0].value;
          }
        if (json.latitude && json.latitude.toString() != null) {
            output.lat = json.latitude.toString();
          }
          if (json.longitude && json.longitude.toString() != null) {
            output.lng = json.longitude.toString();
          }
          if (json.geonames && json.geonames.toString() != null) {
            output.geonames = json.geonames.toString();
          }
          if (json.rism && json.rism.value != null) {
              output.rism = json.rism.value;
          }
          if (json.viaf && json.viaf.value != null) {
              output.viaf = json.viaf.value;
          }
          if (json.isil && json.isil.value != null) {
              output.isil = json.isil.value;
          }
          if (json.gnd && json.gnd.value != null) {
              output.gnd = json.gnd.value;
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
            <a href="https://fpb.saw-leipzig.de/places/institution/${encodeURIComponent(json.pid)}" target="_blank"> ${json.name.concat(' (', json.place, ')')} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.pid}` : json.pid,
          strings: json.name[0].value
        });
      })
      .catch(() => reject());
    });
  }

  infoInstitution(json) {
    const rism = json.rism.value ? json.rism.value : 'Ohne RISM-Sigel';
    return `<p>${rism}</p>`;
  }
}
