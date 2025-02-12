/* eslint-disable class-methods-use-this */
import { Registry } from './registry.js';

function _names(item) {
  let lastnames = '';
  let firstnames = '';
  let ton = '';
  if(item.lastname && item.lastname != null) {
    lastnames = item.lastname;
  }
  else if (item.lastname == null && item.title_of_nobility != null)
    ton = ', ' + item.title_of_nobility;
  else
    lastnames = 'NN, '
  if (item.firstname && item.firstname != null && item.lastname && item.lastname != null) {
    firstnames = ', ' + item.firstname;
  }
  else if (item.firstname && item.firstname != null && item.lastname == null) {
    firstnames = item.firstname;

  }
  else if (item.firstname == null && item.lastname != null)
    firstnames = ', NN';
  else {
    firstnames = 'NN';
  }
  return `${lastnames}${firstnames}${ton}`;
}
function _details(item) {
  let profession = '';
  if (item.professions.length > 0 && item.professions.map(p => p.name.de) != null) {
    profession = item.professions.map(p =>p.name.de).join(', ');
  }
  const dates = [];
  if (item.birthday && item.birthday != null) {
    dates.push('*');
    dates.push(item.birthday);
    dates.push(', ');
  }
  if (item.deathday && item.deathday != null) {    
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
              let lastname = '';
              let firstname = '';
              let ton = '';
              if (item.lastname != null) {
                lastname = item.lastname + ', ';
              } else lastname = '';
              if (item.firstname != null) {
                firstname = item.firstname;
              } else {firstname = '';}  
              if (item.title_of_nobility != null) {
                ton = ', ' + item.title_of_nobility;
              } else {ton = '';}           
            const result = {
                register: this._register,
                id: (this._prefix ? `${this._prefix}-${item.uuid}` : item.uuid),
                label: _names(item),
                link: `https://fpb.saw-leipzig.de/api/person/${encodeURIComponent(item.uuid)}`,
                details: _details(item),
                strings: lastname + firstname + ton,
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
        if (json.lastname && json.lastname != null && json.firstname && json.firstname != null) {
        output.name = json.lastname + ', ' + json.firstname;} 
          else if (!json.lastname && json.lastname == null && json.firstname && json.firstname != null && !json.title_of_nobility && json.title_of_nobility == null) {
            output.name = 'NN, ' + json.firstname
          } 
          else if (json.lastname && json.lastname != null && !json.firstname && json.firstname == null) {
            output.name = json.lastname + ', NN'
          }
          else if (!json.lastname && json.lastname == null && json.firstname && json.firstname != null && json.title_of_nobility && json.title_of_nobility != null)
            output.name = json.firstname + ', ' + json.title_of_nobility
          else {output.name = 'NN'}
        output.link = json.uuid;
        if (json.title_of_nobility && json.title_of_nobility != null) {
          output.titleOfNobility = json.title_of_nobility
        }
        if (json.birthday && json.birthday != null) {
          output.birthDate = json.birthday;
        }
        if (json.birthplace != null && json.birthplace.name[0].value != null) {
          output.birthPlace = json.birthplace.name[0].value;
        }
        if (json.birthplace != null && json.birthplace.latitude != null) {
          output.birthLat = json.birthplace.latitude.toString();
        }
        if (json.birthplace != null && json.birthplace.longitude != null) {
          output.birthLng = json.birthplace.longitude.toString();
        }
        if (json.deathday && json.deathday != null) {
          output.deathDate = json.deathday;
        }
        if (json.deathplace != null && json.deathplace.name[0].value != null) {
          output.deathPlace = json.deathplace.name[0].value;
        }
        if (json.deathplace != null && json.deathplace.latitude != null) {
          output.deathLat = json.deathplace.latitude.toString();
        }
        if (json.deathplace != null && json.deathplace.longitude != null) {
          output.deathLng = json.deathplace.longitude.toString();
        }
        if (json.baptismday && json.baptismday != null) {
          output.baptismDate = json.baptismday;
        }
        if (json.baptismplace != null && json.baptismplace.name[0].value != null) {
          output.baptismPlace = json.baptismplace.name[0].value;
        }
        if (json.baptismplace != null && json.baptismplace.latitude != null) {
          output.baptismLat = json.baptismplace.latitude.toString();
        }
        if (json.baptismplace != null && json.baptismplace.longitude != null) {
          output.baptismLng = json.baptismplace.longitude.toString();
        }
        if (json.burialday && json.burialday != null) {
          output.burialDate = json.burialday;
        }
        if (json.burialplace != null && json.burialplace.name[0].value != null) {
          output.burialPlace = json.burialplace.name[0].value;
        }
        if (json.burialplace != null && json.burialplace.latitude != null) {
          output.burialLat = json.burialplace.latitude.toString();
        }
        if (json.burialplace != null && json.burialplace.longitude != null) {
          output.burialLng = json.burialplace.longitude.toString();
        }
        if (json.professions.length > 0 && json.professions.map(p =>p.name[0]) != null) {
          output.professionOrOccupation = json.professions.map(p =>p.name[0].value);
        }
        if (json.bdid && json.bdid != null) {
          output.bdid = json.bdid;
        }
        if (json.gnd && json.gnd != null) {
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
        let info = this.infoPerson(json);
        let lastname = '';
        let firstname = '';
        let ton = '';
        if (json.lastname != null) {
          lastname = json.lastname;
        } 
        else if (json.lastname == null && json.title_of_nobility != null) {
          ton = ', ' + json.title_of_nobility; 
        }
        else lastname = 'NN';
        if (json.firstname != null) {
          firstname = json.firstname;
        } else firstname = 'NN';
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/person/person/${encodeURIComponent(json.uuid)}" target="_blank"> ${lastname + ', ' + firstname + ton} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.uuid}` : json.uuid,
          strings: [lastname].concat(',',firstname)
        });
      })
      .catch(() => reject());
    });
  }

  infoPerson(json) {
    const professionOrOccupation = json.professions.length > 0 && json.professions.map(p =>p.name[0]) != null ? json.professions.map(p =>p.name[0].value) : [];
    const birthDate = json.birthday != null ? '*'.concat(json.birthday) : '';
    const deathDate = json.deathday != null ? '✝'.concat(json.deathday) : '';
    return `<p>${birthDate} ${deathDate}</p>
      <p>${professionOrOccupation.join(' ')}</p>`;
  }
}
