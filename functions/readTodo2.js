/* Import faunaDB sdk */
const faunadb = require('faunadb')
const getId = require('./utils/getId')
const q = faunadb.query

exports.handler = (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  }) 
  const id = getId(event.path)
  console.log(`Function 'readTodo2' invoked, mr space cadet. Read id: ${id}`)
  console.log('Function readTodo2 invoked, mr space cadeter. Read id:' + id)
  // return client.query(q.Get(q.Ref(`classes/todos/${id}`)))
  return client.query(q.Get(q.Ref(`classes/killMe/${id}`)))
    .then((response) => {
      console.log('success', response)
      return {
        statusCode: 200,
        body: JSON.stringify(response)
      }
    }).catch((error) => {
      console.log('error', error)
      return {
        statusCode: 400,
        body: JSON.stringify(error)
      }
    })
}
