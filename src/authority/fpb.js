/* eslint-disable class-methods-use-this */
import { Registry } from './registry.js';

function _names(item) {
  let lastnames = '';
  let firstnames = '';
  if(item.lastname && item.lastname.length > 0) {
    lastnames = item.lastname;
  }
  else
    lastnames= 'NN'
  if (item.firstname && item.firstname.length > 0) {
    firstnames = item.firstname;
  }
  else 
    firstnames = 'NN'
  return `${lastnames}, ${firstnames}`;
}
function _details(item) {
  let profession = '';
  if (item.professions && item.professions.length > 0) {
    profession = item.professions.map(p => p.name.de).join(', ');
  }
  const dates = [];
  if (item.birthday && item.birthday.length > 0) {
    dates.push('*');
    dates.push(item.birthday);
    dates.push(', ');
  }
  if (item.deathday && item.deathday.length > 0) {    
    dates.push('✝')
    dates.push(item.deathday);
  }
  if (dates.length > 0) {
    return `${dates.join('')}${profession ? `; ${profession}` : ''}`;
  }
  return `${profession}`;
}

/**
 * Uses https://fpb.saw-leipzig.de/api to query FPB
 */
export class FPB extends Registry {
  
  query(key) {
    const results = [];
    let filter;
    switch (this._register) {
      case 'place':
        filter = 'place';
        break;
      default:
        filter = 'person';
        break;
    }
    return new Promise((resolve) => {
        fetch(`https://fpb.saw-leipzig.de/api/${filter}/search/?q=${key}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject();
        })
        .then((json) => {
            json.persons.forEach((item) => {              
            const result = {
                register: this._register,
                id: (this._prefix ? `${this._prefix}-${item.id}` : item.id),
                label: _names(item),
                link: `https://fpb.saw-leipzig.de/api/${filter}/${encodeURIComponent(item.id)}`,
                details: _details(item),
                strings: [item.lastname].concat(',', item.firstname),
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
    let filter;
    switch (this._register) {
      case 'place':
        filter = 'place';
        break;
      default:
        filter = 'person';
        break;
    }
    const id = this._prefix ? key.substring(this._prefix.length + 1) : key;
    return fetch(`https://fpb.saw-leipzig.de/api/${filter}/${encodeURIComponent(id)}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        const output = Object.assign({}, json);
        output.name = [json.lastname].concat(',',json.firstname);
        output.link = json.id;
        if (json.birthday && json.birthday.length > 0) {
          output.birth = json.birthday;
        }
        if (json.deathday && json.deathday.length > 0) {
          output.death = json.deathday;
        }
        if (json.professions && json.professions.length > 0) {
          output.profession = json.professions.map(p => p.name.de);
        }
        return output;
      })
      .catch(() => Promise.reject());
  }

  info(key, container) {
    let filter;
    switch (this._register) {
      case 'place':
        filter = 'place';
        break;
      default:
        filter = 'person';
        break;
    }
    if (!key) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.getRecord(key)
      .then((json) => {   
        let info = this.infoPerson(json);
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/${encodeURIComponent(json.uuid)}" target="_blank"> ${json.lastname.concat(',',json.firstname)} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.id}` : json.id,
          strings: [json.lastname].concat(',',json.firstname)
        });
      })
      .catch(() => reject());
    });
  }

  infoPerson(json) {
    const profession = json.professions ? json.professions.map((p) => p.name.de) : [];
    const birth = json.birthday ? '*'.concat(json.birthday) : '';
    const death = json.deathday ? '✝'.concat(json.deathday) : '';
    return `<p>${birth} ${death}</p>
      <p>${profession.join(' ')}</p>`;
  }
}
