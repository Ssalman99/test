const express = require("express");

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Erorr: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//get todo details

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

app.get("/todos/", async (request, response) => {
  try {
    let data = null;
    let getTodosQuery = "";
    const { search_q = "", priority, status } = request.query;

    switch (true) {
      case hasPriorityAndStatusProperties(request.query):
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
        break;
      case hasPriorityProperty(request.query):
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
        break;
      case hasStatusProperty(request.query):
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
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

    data = await db.all(getTodosQuery);
    response.send(data);
  } catch (e) {
    console.log(`DB get Error: ${e.message}`);
  }
});

// get todo details use of ID

app.get("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;

    const getTodoQuery = `
        SELECT * 
        FROM todo 
        WHERE 
            id= '${todoId}';`;
    const todoArray = await db.get(getTodoQuery);
    response.send(todoArray);
  } catch (e) {
    console.log(`DB get1 Error: ${e.message}`);
  }
});

//add new todo deatails

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
        INSERT INTO  
            todo(id,todo,priority,status)
        VALUES (
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//DELETE deatils

app.delete("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const todo = request.todo;
    const deleteQuery = `
        DELETE FROM todo 
        WHERE 
            id=${todoId};`;
    await db.run(deleteQuery);
    response.send("Todo Deleted");
  } catch (e) {
    console.log(`DB delete Error: ${e.message}`);
  }
});

//update details

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status = "", priority = "", todo = "" } = request.body;
  let updateQuery = null;
  if (status !== "") {
    console.log(status);
    updateQuery = `
        UPDATE 
         todo 
         SET 
            status='${status}'
        WHERE 
            id=${todoId};`;
    await db.run(updateQuery);
    response.send("Status Updated");
  } else if (priority !== "") {
    updateQuery = `
        UPDATE 
         todo 
         SET 
            priority='${priority}'
        WHERE 
            id=${todoId};`;
    await db.run(updateQuery);
    response.send("Priority Updated");
  } else if (todo !== "") {
    updateQuery = `
        UPDATE 
         todo 
         SET 
            todo='${todo}'
        WHERE 
            id=${todoId};`;
    await db.run(updateQuery);
    response.send("Todo Updated");
  }
});

module.exports = app;
