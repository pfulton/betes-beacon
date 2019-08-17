require('dotenv').config();
const axios = require('axios');

const token = process.env.TOKEN;
const lightID = process.env.LIGHT_ID;

const bgDataSource = process.env.BG_DATA_SRC;
const lifxURL = `https://api.lifx.com/v1/lights/${lightID}/effects/pulse`;

const getBGData = async () => {
  try {
    const res = await axios.get(bgDataSource);
    const { sgv, direction } = res.data[0];
    const previousSGV = res.data[1].sgv;
  
    return { sgv, direction, previousSGV };
  } catch (error) {
    console.error(error);
  }
}

const assignBeaconValues = async (sgv, direction, previousSGV) => {
  let newColor, previousColor = '';
  let cycles = 0;

  const assignPreviousColor = () => {
    if (previousSGV <= 69) {
      previousColor = 'red';
    } else if (previousSGV >= 70 && previousSGV <= 169) {
      previousColor = 'green';
    } else {
      previousColor = 'yellow';
    }
  };

  const assignNewColor = () => {
    if (sgv <= 69) {
      newColor = 'red';
    } else if (sgv >= 70 && sgv <= 169) {
      newColor = 'green';
    } else {
      newColor = 'yellow';
    }
  };

  const setCycles = () => {
    if (direction === 'Flat') {
      cycles = 1;
    } else if (direction === 'FortyFiveUp' || direction === 'FortyFiveDown') {
      cycles = 2;
    } else if (direction === 'SingleUp') {
      cycles = 3;
    } else if (direction === 'DoubleUp') {
      cycles = 4;
    } else if (direction === 'SingleDown') {
      cycles = 5;
    } else {
      cycles = 10;
    }
  };

  assignPreviousColor();
  assignNewColor();
  setCycles();

  previousColor = previousColor === newColor ? 'white' : previousColor;

  await initBeacon(previousColor, newColor, cycles);
}

const initBeacon = async (from_color, color, cycles) => {
  try {
    const config = {
      method: 'post',
      url: lifxURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        color,
        from_color,
        cycles,
        persist: true,
        power_on: true
      }
    }
    await axios(config);
  }
  catch (error) {
    console.error(error);
  };
}

const initSugar = async () => {
  const { sgv, direction, previousSGV } = await getBGData();
  assignBeaconValues(sgv, direction, previousSGV);
}

initSugar();
