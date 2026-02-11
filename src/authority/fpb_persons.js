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
  console.log("ITEM", item)
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
              let name = '';
              if (item.name != null) {
                name = item.name;
              } else name = '';      
            const result = {
                register: this._register,
                id: (this._prefix ? `${this._prefix}-${item.pid}` : item.pid),
                label: _names(item),
                link: `https://fpb.saw-leipzig.de/${encodeURIComponent(item.pid)}/json-ld/`,
                details: _details(item),
                strings: name,
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
        console.log("JSON", json)
        if (json.name && json.name != null) {
            output.name = json.name;} 
        else {output.name = 'NN'}
        output.link = json.pid;
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

        const baptismEvent = json.life_event?.find(event => event?.name?.some(n => n['@language'] === 'de' && n.name === 'Taufe'));
        if(baptismEvent) {
          output.baptismEvent = baptismEvent;
          const hasStartDate = !!baptismEvent.start_date;
          const location = baptismEvent.location;
          const hasLocationName = !!location?.name?.find(n => n['@language'] === 'de')?.value;
          const hasCoordinates = !!(location?.latitude && location?.longitude);
          if(hasStartDate) {
            output.baptismDate = baptismEvent.start_date;
          }
          if(location && hasLocationName) {
            output.baptismPlace = location.name.find(n => n['@language'] === 'de').value;
          }
          if(location && hasCoordinates) {
            output.baptismLat = location.latitude.toString();
            output.baptismLng = location.longitude.toString();
          }

        }
        const burialEvent = json.life_event?.find(event => event?.name?.some(n => n['@language'] === 'de' && n.name === 'Beerdigung'));
        if(burialEvent) {
          output.burialEvent = burialEvent;
          const hasStartDate = !!burialEvent.start_date;
          const location = burialEvent.location;
          const hasLocationName = !!location?.name?.find(n => n['@language'] === 'de')?.value;
          const hasCoordinates = !!(location?.latitude && location?.longitude);
          if(hasStartDate) {
            output.burialDate = burialEvent.start_date;
          }
          if(location && hasLocationName) {
            output.burialPlace = location.name.find(n => n['@language'] === 'de').value;
          }
          if(location && hasCoordinates) {
            output.burialLat = location.latitude.toString();
            output.burialLng = location.longitude.toString();
          }
        }
        if(json.profession && json.profession.length > 0) {
          const germanProfessions = json.profession.map(p => p?.name?.find(n => n['@language'] === 'de')?.name).filter(Boolean);
          if(json.profession && germanProfessions.length > 0) {
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
        let name = '';
        if (json.name != null) {
          name = json.name;
        } 
        else name = 'NN';
        const out = `
          <h3 class="label">
            <a href="https://fpb.saw-leipzig.de/${encodeURIComponent(json.pid)}" target="_blank"> ${name} </a>
          </h3>
          ${info}
        `;
        container.innerHTML = out;
        resolve({
          id: this._prefix ? `${this._prefix}-${json.pid}` : json.pid,
          strings: name
        });
      })
      .catch(() => reject());
    });
  }

  infoPerson(json) {
    console.log("JSON_INFO", json)
    const professionOrOccupation = json.profession && json.profession.length > 0 ? json.profession.map(p => p?.name?.find(n => n['@language'] === 'de')?.name) : [];
    const birthDate = json.birthday != null ? '*'.concat(json.birthday) : '';
    const deathDate = json.deathday != null ? '✝'.concat(json.deathday) : '';
    return `<p>${birthDate} ${deathDate}</p>
      <p>${professionOrOccupation.join(' ')}</p>`;
  }
}
