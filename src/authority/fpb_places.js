/* eslint-disable class-methods-use-this */
import { Registry } from './registry.js';

function _details(item) {
    let gnd = item.gnd && item.gnd.value ? item.gnd.value : '';
    let lat = item.latitude ? item.latitude.toString() : '';
    let lng = item.longitude ? item.longitude.toString() : '';
    if (item.latitude && lat.startsWith('-')) {
        lat = 'S '.concat(lat.split('-')[1]);
    } else {
        lat = 'N '.concat(lat);
    }
    if (item.longitude && lng.startsWith('-')) {
        lng = 'W '.concat(lng.split('-')[1]);
    } else {
        lng = 'E '.concat(lng);
    }
    if (item.gnd && item.gnd.value != null) {
        gnd = 'GND: '.concat(item.gnd.value);
      }
      else gnd=' (no GND)';
    return `${lat.concat(', ', lng, ' ', gnd)}`;
  }

/**
 * Uses https://fpb.saw-leipzig.de/api to query FPB
 */
export class FPB_Places extends Registry {
  
  query(key) {
    const results = [];
    return new Promise((resolve) => {
        fetch(`https://fpb.saw-leipzig.de/api/places/place/search/?q=${key}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject();
        })
        .then((json) => {
            json.places.forEach((item) => {        
            const result = {
                register: this._register,
                id: (this._prefix ? `${this._prefix}-${item.uuid}` : item.uuid),
                label: item.name.de,
                link: `https://fpb.saw-leipzig.de/places/place/${encodeURIComponent(item.uuid)}`,
                details: _details(item),
                strings: item.name.de,
                provider: 'FPB_Places'
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
    return fetch(`https://fpb.saw-leipzig.de/api/places/${encodeURIComponent(id)}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        const output = Object.assign({}, json);
        output.name = json.name[0].value;
        output.link = json.uuid;
        if (json.latitude) {
          output.lat = json.latitude.toString();
        }
        if (json.longitude) {
          output.lng = json.longitude.toString();
        }
        if (json.geonames) {
          output.geonames = json.geonames.value.toString();
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
        let info = this.infoPlace(json);
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/places/${encodeURIComponent(json.uuid)}" target="_blank"> ${json.name} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.uuid}` : json.uuid,
          strings: json.name[0].value
        });
      })
      .catch(() => reject());
    });
  }

  infoPlace(json) {
    let lat = json.latitude ? json.latitude.toString() : '';
    let lng = json.longitude ? json.longitude.toString() : '';
    if (lat.startsWith('-')) {
        lat = 'S '.concat(lat.split('-')[1]);
    } else {
        lat = 'N '.concat(lat);
    }
    if (lng.startsWith('-')) {
        lng = 'W '.concat(lng.split('-')[1]);
    } else {
        lng = 'E '.concat(lng);
    }
    return `<p>(${lat}, ${lng})</p>`;
  }
}
