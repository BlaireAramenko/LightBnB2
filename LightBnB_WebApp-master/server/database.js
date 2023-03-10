const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
/* const getUserWithEmail = function(email) {
  let user;
  for (const userId in users) {
    user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      break;
    } else {
      user = null;
    }
  }
  return Promise.resolve(user);
}*/

const getUserWithEmail = function(email) {
  const queryString = `
    SELECT *
    FROM users
    WHERE email = $1;
  `;

  return pool.query(queryString, [email])
    .then(res => res.rows[0])
    .catch(err => null);
};


exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
/* const getUserWithId = function(id) {
  return Promise.resolve(users[id]);
} */

const getUserWithId = function(id) {
  const queryString = `
    SELECT *
    FROM users
    WHERE id = $1;
  `;

  return pool.query(queryString, [id])
    .then(res => res.rows[0])
    .catch(err => null);
};

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
/*const addUser =  function(user) {
  const userId = Object.keys(users).length + 1;
  user.id = userId;
  users[userId] = user;
  return Promise.resolve(user);
} */
const addUser = function(user) {
  const queryString = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [user.name, user.email, user.password];

  return pool.query(queryString, values)
    .then(res => res.rows[0])
    .catch(err => null);
};

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
  `;

  let whereAdded = false; // flag to track if a WHERE clause has already been added

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (whereAdded) {
      queryString += ` AND owner_id = $${queryParams.length}`;
    } else {
      queryString += `WHERE owner_id = $${queryParams.length}`;
      whereAdded = true;
    }
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryParams.push(options.maximum_price_per_night);
    if (whereAdded) {
      queryString += ` AND cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
    } else {
      queryString += `WHERE cost_per_night >= $${queryParams.length - 1} AND cost_per_night <= $${queryParams.length}`;
      whereAdded = true;
    }
  } else if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    if (whereAdded) {
      queryString += ` AND cost_per_night >= $${queryParams.length}`;
    } else {
      queryString += `WHERE cost_per_night >= $${queryParams.length}`;
      whereAdded = true;
    }
  } else if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    if (whereAdded) {
      queryString += ` AND cost_per_night <= $${queryParams.length}`;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length}`;
      whereAdded = true;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    if (whereAdded) {
      queryString += ` AND avg(property_reviews.rating) >= $${queryParams.length}`;
    } else {
      queryString += `WHERE avg(property_reviews.rating) >= $${queryParams.length}`;
    }
  }

  queryParams.push(limit);
  queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
  `;

  return pool.query(queryString, queryParams).then(res => res.rows);
};


exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
/* const getAllProperties = function(options, limit = 10) {
  const limitedProperties = {};
  for (let i = 1; i <= limit; i++) {
    limitedProperties[i] = properties[i];
  }
  return Promise.resolve(limitedProperties);
}
exports.getAllProperties = getAllProperties; */

const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
