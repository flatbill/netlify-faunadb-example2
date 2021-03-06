import React, { Component } from 'react'
import ContentEditable from './components/ContentEditable'
import AppHeader from './components/AppHeader'
import SettingsMenu from './components/SettingsMenu'
import SettingsIcon from './components/SettingsIcon'
import analytics from './utils/analytics'
import api from './utils/api'
import sortByDate from './utils/sortByDate'
import isLocalHost from './utils/isLocalHost'
import './App.css'

export default class App extends Component {
  state = {
    todos: [],
    showMenu: false
  }
  componentDidMount() {

    /* Track a page view */
    analytics.page()

    // Fetch all todos
    api.readAll().then((todos) => {
      if (todos.message === 'unauthorized') {
        if (isLocalHost()) {
          alert('FaunaDB key is not unauthorized. Make sure you set it in terminal session where you ran `npm start`. Visit http://bit.ly/set-fauna-key for more info')
        } else {
          alert('FaunaDB key is not unauthorized. Verify the key `FAUNADB_SERVER_SECRET` set in Netlify enviroment variables is correct')
        }
        return false
      }

      console.log('all todos', todos)
      this.setState({
        todos: todos
      })
    })
  }
  saveTodo = (e) => {
    e.preventDefault()
    const { todos } = this.state
    const todoValue = this.inputElement.value

    if (!todoValue) {
      alert('Please add question text')
      this.inputElement.focus()
      return false
    }

    // reset input to empty
    this.inputElement.value = ''

    const todoInfo = {
      title: todoValue,
      completed: false,
    }
    // Optimistically add todo to UI
    const newTodoArray = [{
      data: todoInfo,
      ts: new Date().getTime() * 10000
    }]

    const optimisticTodoState = newTodoArray.concat(todos)

    this.setState({
      todos: optimisticTodoState
    })
    // Make API request to create new todo
    api.create(todoInfo).then((response) => {
      console.log(response)
      /* Track a custom event */
      analytics.track('todoCreated', {
        category: 'todos',
        label: todoValue,
      })
      // remove temporaryValue from state and persist API response
      const persistedState = removeOptimisticTodo(todos).concat(response)
      // Set persisted value to state
      this.setState({
        todos: persistedState
      })
    }).catch((e) => {
      console.log('An API error occurred', e)
      const revertedState = removeOptimisticTodo(todos)
      // Reset to original state
      this.setState({
        todos: revertedState
      })
    })
  }
  deleteTodo = (e) => {
    const { todos } = this.state
    const todoId = e.target.dataset.id

    // Optimistically remove todo from UI
    const filteredTodos = todos.reduce((acc, current) => {
      const currentId = getTodoId(current)
      if (currentId === todoId) {
        // save item being removed for rollback
        acc.rollbackTodo = current
        return acc
      }
      // filter deleted todo out of the todos list
      acc.optimisticState = acc.optimisticState.concat(current)
      return acc
    }, {
      rollbackTodo: {},
      optimisticState: []
    })

    this.setState({
      todos: filteredTodos.optimisticState
    })

    // Make API request to delete todo
    api.delete(todoId).then(() => {
      console.log(`deleted todo id ${todoId}`)
      analytics.track('todoDeleted', {
        category: 'todos',
      })
    }).catch((e) => {
      console.log(`There was an error removing ${todoId}`, e)
      // Add item removed back to list
      this.setState({
        todos: filteredTodos.optimisticState.concat(filteredTodos.rollbackTodo)
      })
    })
  }
  
  updateTodoTitle = (event, currentValue) => {
    let isDifferent = false
    const todoId = event.target.dataset.key

    const updatedTodos = this.state.todos.map((todo, i) => {
      const id = getTodoId(todo)
      if (id === todoId && todo.data.title !== currentValue) {
        todo.data.title = currentValue
        isDifferent = true
      }
      return todo
    })

    // only set state if input different
    if (isDifferent) {
      this.setState({
        todos: updatedTodos
      }, () => {
        api.update(todoId, {
          title: currentValue
        }).then(() => {
          console.log(`update todo ${todoId}`, currentValue)
          analytics.track('todoUpdated', {
            category: 'todos',
            label: currentValue
          })
        }).catch((e) => {
          console.log('An API error occurred', e)
        })
      })
    }
  }
  clearCompleted = () => {
    const { todos } = this.state

    // Optimistically remove todos from UI
    const data = todos.reduce((acc, current) => {
      if (current.data.completed) {
        // save item being removed for rollback
        acc.completedTodoIds = acc.completedTodoIds.concat(getTodoId(current))
        return acc
      }
      // filter deleted todo out of the todos list
      acc.optimisticState = acc.optimisticState.concat(current)
      return acc
    }, {
      completedTodoIds: [],
      optimisticState: []
    })

    // only set state if completed todos exist
    if (!data.completedTodoIds.length) {
      alert('Please check off some todos to batch remove them')
      this.closeModal()
      return false
    }

    this.setState({
      todos: data.optimisticState
    }, () => {
      setTimeout(() => {
        this.closeModal()
      }, 600)

      api.batchDelete(data.completedTodoIds).then(() => {
        console.log(`Batch removal complete`, data.completedTodoIds)
        analytics.track('todosBatchDeleted', {
          category: 'todos',
        })
      }).catch((e) => {
        console.log('An API error occurred', e)
      })
    })
  }
  closeModal = (e) => {
    this.setState({
      showMenu: false
    })
    analytics.track('modalClosed', {
      category: 'modal'
    })
  }
  ////////////////////////////////////////////////////////////////
  readTodoAndLogIt = (e) => {
    alert('running readTodoAndLogIt')
    const todoId = e.target.dataset.id
    // Make API request 
    api.readTodo2(todoId).then(() => {
      console.log(`read todo id ${todoId}`)     
    }).catch((e) => {
      console.log(`There was an error reading ${todoId}`, e)
    })
  }
  /////////////////////////////////////////////////////////////////
  openModal = () => {
    this.setState({
      showMenu: true
    })
    analytics.track('modalOpened', {
      category: 'modal'
    })
  }
  renderTodos() {
    const { todos } = this.state

    if (!todos || !todos.length) {
      // Loading State here
      return null
    }

    const timeStampKey = 'ts'
    const orderBy = 'desc' // or `asc`
    const sortOrder = sortByDate(timeStampKey, orderBy)
    const todosByDate = todos.sort(sortOrder)

    return todosByDate.map((todo, i) => {
      const { data, ref } = todo
      const id = getTodoId(todo)
      // only show delete button after create API response returns
      let deleteButton
      if (ref) {
        deleteButton = (
          <button data-id={id} onClick={this.deleteTodo}>
            delete
          </button>
        )
      }
      
      
      return (
        <div key={i} className='todo-item'>
          <label className="todo">
          
         
            
            <div className='todo-list-title'>
              <ContentEditable
                tagName='span'
                editKey={id}
                onBlur={this.updateTodoTitle} // save on enter/blur
                html={data.title}
                // onChange={this.handleDataChange} // save on change
              />
            </div>
          </label>
          {deleteButton}
          <button  data-id={id} onClick={this.readTodoAndLogIt} > readTest </button>
        </div>
      )
    })
  }
  render() {
    return (
      <div className='app'>

        <AppHeader />

        <div className='todo-list'>
          <h2>
            Add New Question
            <SettingsIcon onClick={this.openModal} className='mobile-toggle' />
          </h2>
          
          <form className='todo-create-wrapper' onSubmit={this.saveTodo}>
            <input
              className='todo-create-input'
              placeholder='enter question text here'
              name='name'
              ref={el => this.inputElement = el}
              autoComplete='off'
              style={{marginRight: 20}}
            />
            <div className='todo-actions'>
              <button className='todo-create-button'>
                Save the Question
              </button>
              <SettingsIcon onClick={this.openModal}  className='desktop-toggle' />
            </div>
          </form>

          {this.renderTodos()}
        </div>
        <SettingsMenu
          showMenu={this.state.showMenu}
          handleModalClose={this.closeModal}
          handleClearCompleted={this.clearCompleted}
        />
      </div>
    )
  }
}

function removeOptimisticTodo(todos) {
  // return all 'real' todos
  return todos.filter((todo) => {
    return todo.ref
  })
}

function getTodoId(todo) {
  if (!todo.ref) {
    return null
  }
  return todo.ref['@ref'].id
}
