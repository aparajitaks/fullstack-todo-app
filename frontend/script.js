const API_URL = 'http://localhost:3000';

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

function fetchTodos() {
  fetch(`${API_URL}/todos`)
    .then(response => response.json())
    .then(todos => {
      renderTodos(todos);
    })
    .catch(error => {
      console.error('Error fetching todos:', error);
    });
}

function addTodo(title) {
  const newTodo = {
    title: title,
  };

  fetch(`${API_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newTodo),
  })
  .then(() => {
    fetchTodos();
  })
  .catch(error => {
    console.error('Error adding todo:', error);
  });
}

function updateTodo(id, completed) {
  const updatedData = {
    completed: completed,
  };

  fetch(`${API_URL}/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedData),
  })
  .then(() => {
    fetchTodos();
  })
  .catch(error => {
    console.error('Error updating todo:', error);
  });
}

function deleteTodo(id) {
  const isConfirmed = window.confirm("Are you sure you want to delete this task forever?");

  if (isConfirmed) {
    fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
    })
    .then(() => {
      fetchTodos();
    })
    .catch(error => {
      console.error('Error deleting todo:', error);
    });
  }
}

function renderTodos(todos) {
  todoList.innerHTML = '';

  todos.forEach(function(todo) {
    const li = document.createElement('li');
    if (todo.completed) {
      li.classList.add('completed');
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', function() {
      updateTodo(todo.id, checkbox.checked);
      if(checkbox.checked) {
        window.alert("Congrats, you completed one of your tasks!");
      }
    });

    const span = document.createElement('span');
    span.textContent = todo.title;

    const dustbinButton = document.createElement('button');
    dustbinButton.textContent = '🗑️';
    dustbinButton.style.marginLeft = 'auto';
    dustbinButton.style.border = 'none';
    dustbinButton.style.background = 'transparent';
    dustbinButton.style.cursor = 'pointer';
    dustbinButton.style.fontSize = '18px';
    dustbinButton.addEventListener('click', function() {
        deleteTodo(todo.id);
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(dustbinButton);

    todoList.appendChild(li);
  });
}

todoForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const title = todoInput.value.trim();

  if (title) {
    addTodo(title);
    todoInput.value = '';
  }
});

document.addEventListener('DOMContentLoaded', fetchTodos);