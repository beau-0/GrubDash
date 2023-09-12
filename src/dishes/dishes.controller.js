const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list (req, res) {
    res.json({ data: dishes })
}

function dishExists (req, res, next) {
    const dishId = req.params.dishId;
    const findDish = dishes.find((dish) => Number(dishId) === Number(dish.id))
    if (findDish)
    {return next()}
    next ({
        status: 404,
        message: `Dish Id not found: ${req.params.dishId}`
    })
}

function read (req, res, next) {
    const dishId = req.params.dishId;
    const findDish = dishes.find((dish) => Number(dishId) === Number(dish.id));
    res.json({ data: findDish })
}

function create (req, res ) {
    const { data: {name, description, price, image_url }} = req.body;
    const uniqueId = nextId();
    const newDish = {
        id: uniqueId,
        name, description, price, image_url
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish })
}

function hasText (req, res, next) {
    const { data: { name, description, image_url, price }} = req.body;
    if (name && description && image_url && price && Number(price) >= 0)
    {return next()}
  
    const missingFields = [];
    if (!name)
      {missingFields.push("name")}
    if (!description)
      {missingFields.push("description")}
    if (!image_url)
      {missingFields.push("image_url")}
    if (!price || Number(price) <0)
      {missingFields.push("price")}
  
    next({
        status: 400,
        message: missingFields,
    })
}

function update (req, res) {
    const dishId = req.params.dishId;
    const findDish = dishes.find((dish) => Number(dishId) === Number(dish.id))

   const { data: { id, name, description, price, image_url }} = req.body;
  
   if(id && Number(id) !== Number(dishId)) {
        return res.status(400).json({ error: `id mismatch: Expected ${dishId}, but received ${id}` }) }
  
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (isNaN(price) || price <= 0) missingFields.push('price');
    if (!image_url) missingFields.push('image_url');
    if (!Number.isInteger(price)) missingFields.push('price');
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
    } 
    
    findDish.name = name;
    findDish.description = description;
    findDish.price = price;
    findDish.image_url = image_url;
    res.json({ data: findDish });
}

module.exports = {
    list, 
    read: [dishExists, read],
    create: [hasText, create],
    update: [dishExists, update],
}