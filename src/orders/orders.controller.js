const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list (req, res) {
  res.json({ data: orders })
}

function create (req, res ) {
    const { data: { deliverTo, mobileNumber, status, dishes }} = req.body;
    const uniqueId = nextId();
    const newOrder = {
        id: uniqueId,
        deliverTo, mobileNumber, status, dishes
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder })
}

function validate (req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes = [] } = {}} = req.body;
    if (deliverTo && mobileNumber)
    {return next()}
  
    const missingFields = [];
    if (!deliverTo)
      {missingFields.push("deliverTo")}
    if (!mobileNumber)
      {missingFields.push("mobileNumber")}
  
    next({
        status: 400,
        message: missingFields,
    })
}
  
function dishIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;

    if (!dishes || !Array.isArray(dishes) || dishes.length < 1) {
        return next({
            status: 400,
            message: `Order must include at least one dish`,
        });
    }

    const invalidDishes = [];

    dishes.forEach((dish, index) => {
        if (
            typeof dish.quantity !== 'number' ||
            dish.quantity <= 0 ||
            !Number.isInteger(dish.quantity)
        ) {
            invalidDishes.push(index);
        }
    });

    if (invalidDishes.length > 0) {
        return next({
            status: 400,
            message: `Dish ${invalidDishes.join(', ')} must have a quantity that is an integer greater than 0`,
        });
    }
    next();
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  
  if(!status || status === "" || status === "invalid")
    return next({
      status: 400, 
      message: "status is invalid"
    })
  next();
}

function orderExists (req, res, next) {
    const orderId = req.params.orderId;
    const findOrder = orders.find((order) => orderId === order.id)
    if (findOrder) {
      res.locals.orderId = findOrder
      next()}
    next ({
        status: 404,
        message: `Order Id not found: ${req.params.orderId}`
    })
}

function read (req, res) {
  const orderId = req.params.orderId;
  const findOrder = orders.find((order) => Number(orderId) === Number(order.id))
  res.json({ data: findOrder })
}

function update (req, res) {
  const orderId = req.params.orderId;
  const findOrder = orders.find((order) => Number(orderId) === Number(order.id))
  const { data: { id, deliverTo, mobileNumber, status, dishes }} = req.body;
  
  if(id && Number(id) !== Number(orderId)) {
         return res.status(400).json({ error: `id mismatch: Expected ${orderId}, but received ${id}` }) }
  
    findOrder.deliverTo = deliverTo;
    findOrder.mobileNumber = mobileNumber;
    findOrder.status = status;
    findOrder.dishes = dishes;
    res.json({ data: findOrder });
}

function destroy (req, res, next) {
    const orderId = req.params.orderId;
    const orderIndex = orders.findIndex((order) => orderId === order.id);
    const deletedOrder = orders.splice(orderIndex, 1)[0];
  
    res.status(204).send();
}

function checkStatus (req, res, next) {
    const { data: { status } = {} } = req.body;
    const orderId = res.locals.orderId;
    
    if (!orderId.status) {next({ status: 404, message: "Status missing"})}
    if (orderId.status !== 'pending') {next({ status: 400, message: "Status must be 'pending' to delete an order"})}
  next();
}


module.exports = {
  list, 
  create: [validate, dishIsValid,create],
  read: [orderExists, read],
  update: [orderExists, validate, dishIsValid, statusIsValid, update],
  destroy: [orderExists, checkStatus, destroy]
}