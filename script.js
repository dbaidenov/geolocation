'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');
const mainCountryContainer = document.querySelector(
  '.main__country--container'
);

//вывод ошибки
const displayError = function (message) {
  countriesContainer.insertAdjacentText('beforeend', message);
  if (countriesContainer.style.opacity !== 1) {
    countriesContainer.style.opacity = 1;
  }
};

//отображение страны
const displayCountry = function (data, className = '') {
  const currencyName = Object.values(data.currencies)[0].name;
  const currencySymbol = Object.values(data.currencies)[0].symbol;
  const language = Object.values(data.languages)[0];
  const isMainCountry = className == '' ? 'main__country' : '';
  const html = `
  <article class="country ${className} 
  ${isMainCountry}">
  <img class="country__img" src="${data.flags.svg}" />
  <div class="country__data">
    <h3 class="country__name">${data.name.common}</h3>
    <h4 class="country__region">${data.region}</h4>
    <p class="country__row"><span>👨‍👩‍👧‍👦</span>${
      (+data.population / 1000000).toFixed(1) + 'млн'
    }</p>
    <p class="country__row"><span>🗣️</span>${language}</p>
    <p class="country__row"><span>💰</span>${currencyName} ${currencySymbol}</p>
  </div>
  </article>
  `;
  if (className == '') {
    mainCountryContainer.insertAdjacentHTML('beforeend', html);
  } else countriesContainer.insertAdjacentHTML('beforeend', html);
  if (countriesContainer.style.opacity !== 1) {
    countriesContainer.style.opacity = 1;
  }
};

//получение данные из фетч и конверт json
const getDataAndConvertJSON = function (url, message) {
  return fetch(url).then(response => {
    if (response.status === 400)
      throw new Error(`Неверный запрос! Ошибка ${response.status}`);
    if (!response.ok)
      //создаем ошибку вручную. при ошибке сразу же остальное игнорируется и
      //переходит прямо в catch
      throw new Error(`${message}. Ошибка ${response.status}.`);
    return response.json();
  });
};

//переключатель для кнопки
let isDisplayed = false;

//главная функция отображения страны
const displayUserCountry = async function () {
  try {
    const userPos = await new Promise(function (resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude: lat, longitude: lng } = userPos.coords;

    const geocodingResponse = await getDataAndConvertJSON(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}`,
      'Проблема с геокодированием!'
    );

    const userCountryName = geocodingResponse.display_name
      .split(',')
      [geocodingResponse.display_name.split(',').length - 1].trim();

    const userCountryInfo = await fetch(
      `https://restcountries.com/v3.1/name/${userCountryName}`
    )
      .then(data => data.json())
      .then(data => data[0]);

    displayCountry(userCountryInfo);

    const borderCountries = userCountryInfo.borders;

    const borderCountriesRequest = await borderCountries.map(async function (
      country
    ) {
      const countryInfo = await getDataAndConvertJSON(
        `https://restcountries.com/v3.1/alpha/${country}`,
        'Соседняя страна не найдена :('
      );
      return countryInfo;
    });

    const borderCountriesResponse = await Promise.all(borderCountriesRequest);

    const borderCountriesInfo = borderCountriesResponse.map(
      borderCountry => borderCountry[0]
    );

    borderCountriesInfo.forEach(country =>
      displayCountry(country, 'neighbour')
    );

    btn.classList.remove('btn-center');

    isDisplayed = !isDisplayed;

    if (isDisplayed) {
      btn.textContent = 'Нажмите чтобы все удалить все и попробовать по новой!';
    } else {
      btn.classList.add('btn-center');
      removeContent();
      btn.textContent =
        'Где Я? (Чтобы узнать, включите разрешение на геоданные)';
    }
  } catch (e) {
    console.error(e);
    displayError(e.message);
  }
};

//удаление контента
const removeContent = function () {
  const elements = Array.from(countriesContainer.childNodes);
  elements.forEach(function (item) {
    if (item) {
      if (
        item.classList &&
        item.classList.contains('main__country--container')
      ) {
        item.innerHTML = '';
        return;
      }
      countriesContainer.removeChild(item);
    }
  });
};

//обработчик события
btn.addEventListener('click', function () {
  displayUserCountry();
});
