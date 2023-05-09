/* 
  할 일 목록을 관리하고 렌더링하는 주요 컴포넌트입니다.
  상태 관리를 위해 `useState` 훅을 사용하여 할 일 목록과 입력값을 관리합니다.
  할 일 목록의 추가, 삭제, 완료 상태 변경 등의 기능을 구현하였습니다.
*/
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import TodoItem from "@/components/TodoItem";
import styles from "@/styles/TodoList.module.css";

import { db } from "@/firebase";
import {
  collection,
  query,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
} from "firebase/firestore";

const todoCollection = collection(db, "todos");

// TodoList 컴포넌트를 정의합니다.
const TodoList = () => {
  // 상태를 관리하는 useState 훅을 사용하여 할 일 목록과 입력값을 초기화합니다.
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [userinfo, setUserinfo] = useState(0);

  const { data } = useSession();

  const setAdmin = () => {
    const admin_arr = ["김진중", "김남희", "한승오", "김선정", "김명원"];
    if (userinfo === 1) {
      setUserinfo(0);
    } else {
      if (admin_arr.includes(data.user.name)) {
        setUserinfo(1);
      } else alert("Not an admin user");
    }
  };

  const getTodos = async () => {
    if (!data?.user?.name) return;
    let q;

    if (userinfo == 1) {
      q = query(todoCollection, orderBy("datetime", "asc"));
    } else {
      q = query(
        todoCollection,
        where("userId", "==", data?.user?.id),
        orderBy("datetime", "asc")
      );
    }

    const results = await getDocs(q);
    const newTodos = [];

    results.docs.forEach((doc) => {
      newTodos.push({ id: doc.id, ...doc.data() });
    });

    setTodos(newTodos);
  };

  useEffect(() => {
    getTodos();
  }, [data, userinfo]);

  // addTodo 함수는 입력값을 이용하여 새로운 할 일을 목록에 추가하는 함수입니다.
  const addTodo = async () => {
    // 입력값이 비어있는 경우 함수를 종료합니다.
    if (input.trim() === "") return;
    // 기존 할 일 목록에 새로운 할 일을 추가하고, 입력값을 초기화합니다.
    // {
    //   id: 할일의 고유 id,
    //   text: 할일의 내용,
    //   completed: 완료 여부,
    // }
    // ...todos => {id: 1, text: "할일1", completed: false}, {id: 2, text: "할일2", completed: false}}, ..
    const day = new Date().toISOString().replace("T", " ").slice(0, -5);

    const docRef = await addDoc(todoCollection, {
      userId: data?.user?.id,
      text: input,
      completed: false,
      datetime: day,
    });

    setTodos([
      {
        id: docRef.id,
        text: input,
        completed: false,
        datetime: day,
      },
      ...todos,
    ]);
    setInput("");
  };

  // toggleTodo 함수는 체크박스를 눌러 할 일의 완료 상태를 변경하는 함수입니다.
  const toggleTodo = async (id) => {
    let q = query(todoCollection, where("userId", "==", data?.user?.id));

    const results = await getDocs(q);
    const userTodoIds = [];

    results.docs.forEach((doc) => {
      userTodoIds.push(doc.id);
    });

    if (!userTodoIds.includes(id)) {
      alert("Can't toggle other's Todo");
    } else {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          const todoDoc = doc(todoCollection, id);
          updateDoc(todoDoc, { completed: !todo.completed });
          return { ...todo, completed: !todo.completed };
        } else {
          return todo;
        }
      });
      setTodos(newTodos);
    }
  };

  // deleteTodo 함수는 할 일을 목록에서 삭제하는 함수입니다.
  const deleteTodo = async (id) => {
    let q = query(todoCollection, where("userId", "==", data?.user?.id));

    const results = await getDocs(q);
    const userTodoIds = [];

    results.docs.forEach((doc) => {
      userTodoIds.push(doc.id);
    });

    if (!userTodoIds.includes(id)) {
      alert("Can't delete other's todo");
    } else {
      const todoDoc = doc(todoCollection, id);
      deleteDoc(todoDoc);

      setTodos(
        todos.filter((todo) => {
          return todo.id !== id;
        })
      );
    }
  };
  // 컴포넌트를 렌더링합니다.
  return (
    <div className={styles.container}>
      <h1 className="text-xl mb-4 font-bold underline underline-offset-4 decoration-wavy">
        {data?.user?.name}'s Todo List
      </h1>
      <button
        className="w-38 justify-self-end p-1 mb-4 bg-blue-500 text-white border border-blue-500 rounded hover:bg-white hover:text-blue-500"
        onClick={setAdmin}
      >
        {userinfo ? "관리자모드" : "일반모드"}
      </button>
      {/* 할 일을 입력받는 텍스트 필드입니다. */}
      <input
        type="text"
        // className={styles.itemInput}
        // -- itemInput CSS code --
        // input[type="text"].itemInput {
        //   width: 100%;
        //   padding: 5px;
        //   margin-bottom: 10px;
        // }
        className="shadow-lg w-full p-1 mb-4 border border-gray-300 rounded"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {/* 할 일을 추가하는 버튼입니다. */}
      <div class="grid">
        <button
          // className={styles.addButton}
          // -- addButton CSS code --
          // button.addButton {
          //   padding: 5px;
          //   background-color: #0070f3;
          //   color: white;
          //   border: 1px solid #0070f3;
          //   border-radius: 5px;
          //   cursor: pointer;
          // }
          //
          // button.addButton:hover {
          //   background-color: #fff;
          //   color: #0070f3;
          // }
          className="w-40 justify-self-end p-1 mb-4 bg-blue-500 text-white border border-blue-500 rounded hover:bg-white hover:text-blue-500"
          onClick={addTodo}
        >
          Add Todo
        </button>
      </div>
      {/* 할 일 목록을 렌더링합니다. */}
      <ul>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTodo(todo.id)}
            onDelete={() => deleteTodo(todo.id)}
          />
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
