/* eslint-disable class-methods-use-this */
import { Registry } from './registry.js';

/**
 * Uses https://fpb.saw-leipzig.de/api to query FPB
 */
export class FPB_Glossary extends Registry {
 
  query(key) {
    const results = [];
    return new Promise((resolve) => {
        fetch(`https://fpb.saw-leipzig.de/api/glossary/search/?q=${key}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject();
        })
        .then((json) => {
            json.items.forEach((item) => {  
            const result = {
                register: this._register,
                id: (this._prefix ? `${this._prefix}-${item.pid}` : item.pid),
                label: item.title.de,
                link: `https://fpb.saw-leipzig.de/${encodeURIComponent(item.pid)}/json-ld/`,
                strings: item.title.de,
                provider: 'FPB'
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
    return fetch(`https://fpb.saw-leipzig.de/${encodeURIComponent(id)}/json-ld/`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        const output = Object.assign({}, json);
        const chars = {
          '*': '',
          '__': '',
          '^': '',
          '~': '',
          ']': ': ',
          '[': '',
          '(': '',
          ')': ''
        };
        
        output.title = json.name[0].name;
        output.desc = json.description[0].description.replace(/[*]/g, m => chars[m]);
        output.link = json.pid;
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
        let info = json.name[0].name;
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/${encodeURIComponent(json.pid)}" target="_blank"> ${json.name[0].name} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.pid}` : json.pid,
          strings: json.name[0].name
        });
      })
      .catch(() => reject());
    });
  }
}
