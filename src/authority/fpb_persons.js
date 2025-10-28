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
                id: (this._prefix ? `${this._prefix}-${item.pid}` : item.pid),
                label: _names(item),
                link: `https://fpb.saw-leipzig.de/${encodeURIComponent(item.pid)}/json-ld/`,
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
    return fetch(`https://fpb.saw-leipzig.de/${encodeURIComponent(id)}/json-ld/`)
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
        output.link = json.pid;
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

        const baptismEvent = json.lifeEvents?.find(event => event?.name?.some(n => n['@language'] === 'de' && n.name === 'Taufe'));
        if(baptismEvent) {
          const hasStartDate = !!baptismEvent.startDate;
          const location = baptismEvent.location;
          const hasLocationName = !!location?.name?.find(n => n['@language'] === 'de')?.value;
          const hasCoordinates = !!(location?.latitude && location?.longitude);
          if(location && hasStartDate) {
            output.baptismDate = baptismEvent.startDate;
          }
          if(location && hasLocationName) {
            output.burialPlace = location.name.find(n => n['@language'] === 'de').value;
          }
          if(location && hasCoordinates) {
            output.baptismLat = location.latitude;
            output.baptismLng = location.longitude;
          }

        }
        const burialEvent = json.lifeEvents?.find(event => event?.name?.some(n => n['@language'] === 'de' && n.name === 'Beerdigung'));
        if(burialEvent) {
          const hasStartDate = !!burialEvent.startDate;
          const location = burialEvent.location;
          const hasLocationName = !!location?.name?.find(n => n['@language'] === 'de')?.value;
          const hasCoordinates = !!(location?.latitude && location?.longitude);
          if(location && hasStartDate) {
            output.burialDate = burialEvent.startDate;
          }
          if(location && hasLocationName) {
            output.burialPlace = location.name.find(n => n['@language'] === 'de').value;
          }
          if(location && hasCoordinates) {
            output.burialLat = location.latitude;
            output.burialLng = location.longitude;
          }
        }
        if(json.professions && json.professions.length > 0) {
          const germanProfessions = json.professions.map(p => p?.name?.find(n => n['@language'] === 'de')?.name).filter(Boolean);
          if(json.professions && germanProfessions.length > 0) {
            output.professionOrOccupation = germanProfessions;
          }
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
            <a href="https://fpb.saw-leipzig.de/${encodeURIComponent(json.pid)}" target="_blank"> ${lastname + ', ' + firstname + ton} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.pid}` : json.pid,
          strings: [lastname].concat(',',firstname)
        });
      })
      .catch(() => reject());
    });
  }

  infoPerson(json) {
    const professionOrOccupation = json.professions && json.professions.length > 0 ? json.professions.map(p => p?.name?.find(n => n['@language'] === 'de')?.name) : [];
    const birthDate = json.birthday != null ? '*'.concat(json.birthday) : '';
    const deathDate = json.deathday != null ? '✝'.concat(json.deathday) : '';
    return `<p>${birthDate} ${deathDate}</p>
      <p>${professionOrOccupation.join(' ')}</p>`;
  }
}
