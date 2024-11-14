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
export class FPB_Persons extends Registry {
  
  query(key) {
    const results = [];
    return new Promise((resolve) => {
        fetch(`https://fpb.saw-leipzig.de/api/person/search/?q=${key}`)
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
                id: (this._prefix ? `${this._prefix}-${item.uuid}` : item.uuid),
                label: _names(item),
                link: `https://fpb.saw-leipzig.de/api/person/${encodeURIComponent(item.uuid)}`,
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
    const id = this._prefix ? key.substring(this._prefix.length + 1) : key;
    return fetch(`https://fpb.saw-leipzig.de/api/person/${encodeURIComponent(id)}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject();
      })
      .then((json) => {
        const output = Object.assign({}, json);
        output.name = [json.lastname].concat(',',json.firstname);
        output.link = json.uuid;
        if (json.birthday && json.birthday.length > 0) {
          output.birthDate = json.birthday;
        }
        if (json.birthplace && json.birthplace.name.length > 0) {
          output.birthPlace = json.birthplace.name.de;
        }
        if (json.birthplace && json.birthplace.latitude) {
          output.birthLat = json.birthplace.latitude.toString();
        }
        if (json.birthplace && json.birthplace.longitude) {
          output.birthLng = json.birthplace.longitude.toString();
        }
        if (json.deathday && json.deathday.length > 0) {
          output.deathDate = json.deathday;
        }
        if (json.deathplace && json.deathplace.name.length > 0) {
          output.deathPlace = json.deathplace.name.de;
        }
        if (json.deathplace && json.deathplace.latitude) {
          output.deathLat = json.deathplace.latitude.toString();
        }
        if (json.deathplace && json.deathplace.longitude) {
          output.deathLng = json.deathplace.longitude.toString();
        }
        if (json.baptismday && json.baptismday.length > 0) {
          output.baptismDate = json.baptismday;
        }
        if (json.baptismplace && json.baptismplace.name.length > 0) {
          output.baptismPlace = json.baptismplace.name.de;
        }
        if (json.baptismplace && json.baptismplace.latitude) {
          output.baptismLat = json.baptismplace.latitude.toString();
        }
        if (json.baptismplace && json.baptismplace.longitude) {
          output.baptismLng = json.baptismplace.longitude.toString();
        }
        if (json.burialday && json.burialday.length > 0) {
          output.burialDate = json.burialday;
        }
        if (json.burialplace && json.burialplace.name.length > 0) {
          output.burialPlace = json.burialplace.name.de;
        }
        if (json.burialplace && json.burialplace.latitude) {
          output.burialLat = json.burialplace.latitude.toString();
        }
        if (json.burialplace && json.burialplace.longitude) {
          output.burialLng = json.burialplace.longitude.toString();
        }
        if (json.professions && json.professions.length > 0) {
          output.professionOrOccupation = json.professions.map(p => p.name.de);
        }
        if (json.bdid && json.bdid.length > 0) {
          output.bdid = json.bdid;
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
        console.log("TESTJSON", json);
        let info = this.infoPerson(json);
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/person/person/${encodeURIComponent(json.uuid)}" target="_blank"> ${json.lastname.concat(',',json.firstname)} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.uuid}` : json.uuid,
          strings: [json.lastname].concat(',',json.firstname)
        });
      })
      .catch(() => reject());
    });
  }

  infoPerson(json) {
    const professionOrOccupation = json.professions ? json.professions.map(p => p.name.de) : [];
    const birthDate = json.birthday ? '*'.concat(json.birthday) : '';
    const deathDate = json.deathday ? '✝'.concat(json.deathday) : '';
    return `<p>${birthDate} ${deathDate}</p>
      <p>${professionOrOccupation.join(' ')}</p>`;
  }
}
