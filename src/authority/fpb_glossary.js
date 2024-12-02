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
                id: (this._prefix ? `${this._prefix}-${item.slug}` : item.slug),
                label: item.title.de,
                link: `https://fpb.saw-leipzig.de/glossary/${encodeURIComponent(item.slug)}`,
                details: item.title.de,
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
    return fetch(`https://fpb.saw-leipzig.de/api/glossary/${encodeURIComponent(id)}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        const output = Object.assign({}, json);
        const chars = {
          '**': '',
          '*': '-',
          '__': '',
          '^': '',
          '~': '',
          ']': ': ',
          '[': '',
          '(': '',
          ')': ''
        };
        
        output.title = json.title.de;
        output.desc = json.text.de.replace(/[*]/g, m => chars[m]);
        output.link = json.slug;
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
        let info = json.title.de;
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/glossary/${encodeURIComponent(json.slug)}" target="_blank"> ${json.lastname.concat(',',json.firstname)} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.slug}` : json.slug,
          strings: json.title.de
        });
      })
      .catch(() => reject());
    });
  }
}
