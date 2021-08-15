const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const { format } = require("date-fns");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

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
  return requestQuery.category !== undefined;
};
const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const checkingStatus = (requestBody) => {
  return requestBody.status === "TO DO" || "IN PROGRESS" || "DONE";
};
const checkingPriorities = (requestBody) => {
  return requestBody.priority === "LOW" || "HIGH" || "MEDIUM";
};
const checkingCategory = (requestBody) => {
  return requestBody.todo === "WORK" || "LEARNING" || "HOME";
};

const checkingStatusAndPriorities = (requestBody) => {
  return (
    (requestBody.status === "TO DO" || "IN PROGRESS" || "DONE") &&
    (requestBody.priority === "LOW" || "HIGH" || "MEDIUM")
  );
};

///1 get todos based on Queries API
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  ///console.log(status);
  let getTodosQuery = "";
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
            AND priority = '${priority}';
        `;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM 
            todo
        WHERE 
            todo like '%${search_q}%'
            AND priority = '${priority}';
        `;
      //console.log(priority);
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM 
            todo
        WHERE 
            todo like '%${search_q}%'
            AND category = '${category}';
        `;
      break;
    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM 
            todo
        WHERE 
            todo like '%${search_q}%'
            AND status = '${status}'
            AND category = '${category}';
        `;
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM 
            todo
        WHERE 
            todo like '%${search_q}%'
            AND priority = '${priority}'
            AND category = '${category}';
        `;
      break;

    default:
      getTodosQuery = `
        SELECT
            *
        FROM 
            todo
        WHERE 
            todo LIKE '%${search_q}%'`;
  }
  const todoList = await db.all(getTodosQuery);
  response.send(todoList);
});

///
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

///
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(date);
  const year = new Date(date).getFullYear();
  //console.log(year);
  const month = new Date(date).getMonth();
  const day = new Date(date).getDate();
  const formatted_date = format(new Date(year, month, day), "yyyy-MM-dd");
  //console.log(formatted_date);
  const getTodoQuery = `
    SELECT *
    FROM todo 
    WHERE due_date = '${formatted_date}';`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

///4
if (checkingStatusAndPriorities) {
  app.post("/todos/", async (request, response) => {
    const bodyDetails = request.body;
    //console.log(bodyDetails);
    const { id, todo, priority, status, category, dueDate } = request.body;
    //console.log(todo);
    const addNewTodoQuery = `
   INSERT INTO 
        todo(id,todo,priority,status,category,due_date)
   VALUES 
        (${id},'${todo}', '${priority}','${status}','${category}','${dueDate}');`;

    await db.run(addNewTodoQuery);
    response.send("Todo Successfully Added");
  });
} else {
  response.send("Invalid Status");
}

///5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE 
            id = ${todoId};`;
  const singleTodo = await db.get(getTodoQuery);

  const requestBody = request.body;
  const {
    id = singleTodo.id,
    todo = singleTodo.todo,
    priority = singleTodo.priority,
    status = singleTodo.status,
    category = singleTodo.category,
    dueDate = singleTodo.dueDate,
  } = requestBody;

  const updateTodo = async () => {
    const updateTodoQuery = `
    UPDATE todo
    SET 
        todo='${todo}',
        priority='${priority}',
        status='${status}',
        category = '${category}',
        due_date = '${dueDate}'
    WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  };

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      if (checkingStatus) {
        updateTodo();
      } else {
        response.status(401);
        response.send("Invalid Todo status");
      }
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      if (checkingPriorities) {
        updateTodo();
      } else {
        response.status(401);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "category";
      if (checkingCategory) {
        updateTodo();
      } else {
        response.status(401);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "dueDate";
      break;
  }
});

///6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo 
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
