
// read one question by myId from qtQuestions collection.
let myFaunaCollection = 'qtQuestions'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const getId = require('./utils/getId')
const getId2 = require('./utils/getId2') // test that I can create util funcs and include them here.
const q = faunadb.query


exports.handler = (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const id = getId(event.path) // likely relies on html that has fauna rec id already baked into the path. maybe shadow dom.
  const id666 = getId2(event.path) // test function call, dont use this.
  //console.log(`Function 'readTodo2' invoked, mr space cadet. Read id: ${id}`) // dave likes template literals. inside `me`.
  console.log('Function readTodo2 invoked. Read id:' + id) // works.  avoids template literal.
  // return client.query(q.Get(q.Ref(`classes/todos/${id}`)))
  // return client.query(q.Get(q.Ref(`classes/killMe/${id}`)))
  // return client.query(q.Get(q.Ref(`classes/killMe/276373561266930176`)))
  //
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  // let myFaunaCollection = 'killMe' //works
  // let myFaunaId =  '276373561266930176' // works if you have the correct database+collection
 
  // let myFaunaCollection = 'qtQuestions'
  let myFaunaId =  '276380634185728512'
  let myFaunaFetchRef = 'classes/' + myFaunaCollection + '/'+ myFaunaId
  
  return client.query(q.Get(q.Ref(myFaunaFetchRef)))
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
