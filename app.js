const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const { format, isValid, parse } = require("date-fns");
const parseISO = require("date-fns/parseISO");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const givenPriority = ["HIGH", "MEDIUM", "LOW"];

const givenStatus = ["TO DO", "IN PROGRESS", "DONE"];

const givenCategory = ["WORK", "HOME", "LEARNING"];

const hasCategoryAndStatusProperties = (requestQuery) => {
  return requestQuery.category != undefined && requestQuery.status != undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category != undefined && requestQuery.priority != undefined
  );
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category != undefined;
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.date != undefined;
};

//API : 1 => Getting todo list

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (givenPriority.includes(priority) && givenStatus.includes(status)) {
        getTodosQuery = `
            SELECT
            *
            FROM
            todo 
            WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority or Status");
      }

      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (
        givenCategory.includes(category) &&
        givenPriority.includes(priority)
      ) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category or Priority");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (givenCategory.includes(category) && givenStatus.includes(status)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category or Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (givenPriority.includes(priority)) {
        getTodosQuery = `
            SELECT
            *
            FROM
            todo 
            WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasStatusProperty(request.query):
      if (givenStatus.includes(status)) {
        getTodosQuery = `
            SELECT
            *
            FROM
            todo 
            WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasCategoryProperty(request.query):
      if (givenCategory.includes(category)) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
            SELECT
            *
            FROM
            todo 
            WHERE
            todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

//API 2 => Get specific todo

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

// API 3 => Returns a list of all todo's with given due date

app.get("/agenda/", async (request, response) => {
  let todo = null;
  let getTodoQuery = "";
  let { date } = request.query;

  let dateParse = parseISO(date);

  if (isValid(dateParse)) {
    const updateDate = format(new Date(date), "yyyy-MM-dd");
    getTodoQuery = `
    SELECT
    *
    FROM
    todo
    WHERE
    due_date = ${updateDate};`;
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }

  todo = await database.all(getTodoQuery);
  response.send(todo);
});

//API 4 => Add a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
    INSERT INTO
    todo (id, todo, priority, status, category, due_date)
    VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API-6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
 DELETE FROM
 todo
 WHERE
 id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
