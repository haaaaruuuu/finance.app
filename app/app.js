const { useState, useEffect } = React;

function マルチウォレット収支管理アプリ() {
  // 各ウォレットの残高
  const [wallets, setWallets] = useState(() => {
    const savedWallets = localStorage.getItem("wallets");
    return savedWallets ? JSON.parse(savedWallets) : {
      現金: 0,
      財布: 0,
      アプリ: 0,
      交通系IC: 0
    };
  });

  // 収支データの状態
  const [transactions, setTransactions] = useState(() => {
    const savedData = localStorage.getItem("transactions");
    return savedData ? JSON.parse(savedData) : [];
  });
  
  // 入力フォームの状態
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense"); // 支出がデフォルト
  const [category, setCategory] = useState("食費");
  const [wallet, setWallet] = useState("財布");
  const [transferTo, setTransferTo] = useState("アプリ");
  
  // 表示フィルター
  const [filter, setFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  
  // カテゴリーリスト
  const categories = {
    income: ["給料", "ボーナス", "その他収入"],
    expense: ["食費", "住居費", "交通費", "光熱費", "通信費", "娯楽費", "医療費", "その他支出"],
    transfer: ["送金"]
  };
  
  // データ保存
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("wallets", JSON.stringify(wallets));
  }, [transactions, wallets]);
  
  // 新しい取引を追加
  const addTransaction = () => {
    if (!date || !description || !amount || amount <= 0) {
      alert("すべての項目を正しく入力してください");
      return;
    }
    
    const amountNum = parseFloat(amount);
    const newTransaction = {
      id: Date.now(),
      date,
      description,
      amount: amountNum,
      type,
      category: type === "transfer" ? "送金" : category,
      wallet,
      transferTo: type === "transfer" ? transferTo : null
    };
    
    // ウォレット残高の更新
    const newWallets = { ...wallets };
    
    if (type === "income") {
      newWallets[wallet] += amountNum;
    } else if (type === "expense") {
      newWallets[wallet] -= amountNum;
    } else if (type === "transfer") {
      // 送金元から減額
      newWallets[wallet] -= amountNum;
      // 送金先に追加
      newWallets[transferTo] += amountNum;
    }
    
    setWallets(newWallets);
    setTransactions([newTransaction, ...transactions]);
    
    // フォームリセット
    setDescription("");
    setAmount("");
  };
  
  // 取引を削除
  const deleteTransaction = (id) => {
    const transaction = transactions.find(t => t.id === id);
    
    // ウォレット残高の調整
    const newWallets = { ...wallets };
    if (transaction.type === "income") {
      newWallets[transaction.wallet] -= transaction.amount;
    } else if (transaction.type === "expense") {
      newWallets[transaction.wallet] += transaction.amount;
    } else if (transaction.type === "transfer") {
      // 送金元に戻す
      newWallets[transaction.wallet] += transaction.amount;
      // 送金先から引く
      newWallets[transaction.transferTo] -= transaction.amount;
    }
    
    setWallets(newWallets);
    setTransactions(transactions.filter(t => t.id !== id));
  };
  
  // ウォレットの残高を直接編集
  const editWalletBalance = (walletName, newBalance) => {
    setWallets({
      ...wallets,
      [walletName]: parseFloat(newBalance)
    });
  };
  
  // フィルタリングされたトランザクションを取得
  const getFilteredTransactions = () => {
    let result = [...transactions];
    
    if (filter !== "all") {
      result = result.filter(t => t.type === filter);
    }
    
    if (walletFilter !== "all") {
      result = result.filter(t => 
        t.wallet === walletFilter || 
        (t.type === "transfer" && t.transferTo === walletFilter)
      );
    }
    
    return result;
  };

  // 総計を計算
  const calculateTotal = (type) => {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  // 残高合計を計算
  const calculateTotalBalance = () => {
    return Object.values(wallets).reduce((sum, balance) => sum + balance, 0);
  };
  
  // キーダウンイベントの処理（エンターキーでフォーム送信）
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      addTransaction();
    }
  };
  
  return React.createElement(
    "div",
    { className: "mx-auto max-w-4xl p-4 bg-gray-50 min-h-screen" },
    React.createElement("h1", { className: "text-2xl font-bold text-center mb-6 text-blue-600" }, "マルチウォレット収支管理アプリ"),
    
    // ウォレット残高表示
    React.createElement(
      "div",
      { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" },
      Object.entries(wallets).map(([name, balance]) =>
        React.createElement(
          "div",
          { key: name, className: "bg-white p-4 rounded-lg shadow" },
          React.createElement("h2", { className: "text-lg font-semibold mb-2" }, name),
          React.createElement(
            "div",
            { className: "flex justify-between items-center" },
            React.createElement(
              "p",
              { className: `text-xl font-bold ${balance < 0 ? 'text-red-500' : 'text-green-500'}` },
              `¥${balance.toLocaleString()}`
            ),
            React.createElement(
              "div",
              { className: "flex items-center" },
              React.createElement("input", {
                type: "number",
                className: "border rounded w-24 px-2 py-1 text-sm mr-2",
                value: balance,
                onChange: (e) => editWalletBalance(name, e.target.value)
              }),
              React.createElement(
                "button",
                {
                  className: "bg-blue-500 text-white text-sm px-2 py-1 rounded",
                  onClick: () => editWalletBalance(name, balance)
                },
                "更新"
              )
            )
          )
        )
      )
    ),
    
    // 新しい取引入力フォーム
    React.createElement(
      "div",
      { className: "bg-white p-4 rounded-lg shadow mb-6" },
      React.createElement("h2", { className: "text-lg font-semibold mb-4" }, "新しい取引を追加"),
      React.createElement(
        "div",
        { className: "space-y-4" },
        React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
          React.createElement(
            "div",
            null,
            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "日付"),
            React.createElement("input", {
              type: "date",
              className: "w-full p-2 border rounded",
              value: date,
              onChange: (e) => setDate(e.target.value),
              onKeyDown: handleKeyDown
            })
          ),
          React.createElement(
            "div",
            null,
            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "金額（円）"),
            React.createElement("input", {
              type: "number",
              className: "w-full p-2 border rounded",
              min: "1",
              step: "1",
              value: amount,
              onChange: (e) => setAmount(e.target.value),
              onKeyDown: handleKeyDown
            })
          )
        ),
        React.createElement(
          "div",
          null,
          React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "説明"),
          React.createElement("input", {
            type: "text",
            className: "w-full p-2 border rounded",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            onKeyDown: handleKeyDown
          })
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
          React.createElement(
            "div",
            null,
            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "取引タイプ"),
            React.createElement(
              "select",
              {
                className: "w-full p-2 border rounded",
                value: type,
                onChange: (e) => setType(e.target.value)
              },
              React.createElement("option", { value: "expense" }, "支出"),
              React.createElement("option", { value: "income" }, "収入"),
              React.createElement("option", { value: "transfer" }, "ウォレット間送金")
            )
          ),
          type !== "transfer" ? [
            React.createElement(
              "div",
              { key: "category" },
              React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "カテゴリー"),
              React.createElement(
                "select",
                {
                  className: "w-full p-2 border rounded",
                  value: category,
                  onChange: (e) => setCategory(e.target.value)
                },
                categories[type].map(cat =>
                  React.createElement("option", { key: cat, value: cat }, cat)
                )
              )
            ),
            React.createElement(
              "div",
              { key: "wallet" },
              React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "ウォレット"),
              React.createElement(
                "select",
                {
                  className: "w-full p-2 border rounded",
                  value: wallet,
                  onChange: (e) => setWallet(e.target.value)
                },
                Object.keys(wallets).map(w =>
                  React.createElement("option", { key: w, value: w }, w)
                )
              )
            )
          ] : [
            React.createElement(
              "div",
              { key: "from" },
              React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "送金元"),
              React.createElement(
                "select",
                {
                  className: "w-full p-2 border rounded",
                  value: wallet,
                  onChange: (e) => setWallet(e.target.value)
                },
                Object.keys(wallets).map(w =>
                  React.createElement("option", { key: w, value: w }, w)
                )
              )
            ),
            React.createElement(
              "div",
              { key: "to" },
              React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "送金先"),
              React.createElement(
                "select",
                {
                  className: "w-full p-2 border rounded",
                  value: transferTo,
                  onChange: (e) => setTransferTo(e.target.value),
                  disabled: Object.keys(wallets).length <= 1
                },
                Object.keys(wallets)
                  .filter(w => w !== wallet)
                  .map(w =>
                    React.createElement("option", { key: w, value: w }, w)
                  )
              )
            )
          ]
        ),
        React.createElement(
          "button",
          {
            onClick: addTransaction,
            className: "w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded"
          },
          "追加"
        )
      )
    ),
    
    // 取引履歴
    React.createElement(
      "div",
      { className: "bg-white p-4 rounded-lg shadow" },
      React.createElement(
        "div",
        { className: "flex flex-col md:flex-row md:justify-between md:items-center mb-4" },
        React.createElement("h2", { className: "text-lg font-semibold mb-2 md:mb-0" }, "取引履歴"),
        React.createElement(
          "div",
          { className: "flex space-x-2" },
          React.createElement(
            "select",
            {
              className: "p-2 border rounded text-sm",
              value: filter,
              onChange: (e) => setFilter(e.target.value)
            },
            React.createElement("option", { value: "all" }, "すべてのタイプ"),
            React.createElement("option", { value: "income" }, "収入のみ"),
            React.createElement("option", { value: "expense" }, "支出のみ"),
            React.createElement("option", { value: "transfer" }, "送金のみ")
          ),
          React.createElement(
            "select",
            {
              className: "p-2 border rounded text-sm",
              value: walletFilter,
              onChange: (e) => setWalletFilter(e.target.value)
            },
            React.createElement("option", { value: "all" }, "すべてのウォレット"),
            Object.keys(wallets).map(w =>
              React.createElement("option", { key: w, value: w }, w)
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "overflow-x-auto" },
        React.createElement(
          "table",
          { className: "min-w-full" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "bg-gray-100" },
              React.createElement("th", { className: "py-2 px-4 text-left" }, "日付"),
              React.createElement("th", { className: "py-2 px-4 text-left" }, "説明"),
              React.createElement("th", { className: "py-2 px-4 text-left" }, "カテゴリー"),
              React.createElement("th", { className: "py-2 px-4 text-left" }, "ウォレット"),
              React.createElement("th", { className: "py-2 px-4 text-right" }, "金額"),
              React.createElement("th", { className: "py-2 px-4 text-center" }, "操作")
            )
          ),
          React.createElement(
            "tbody",
            null,
            getFilteredTransactions().length > 0 ?
              getFilteredTransactions().map(transaction =>
                React.createElement(
                  "tr",
                  { key: transaction.id, className: "border-t hover:bg-gray-50" },
                  React.createElement("td", { className: "py-2 px-4" }, transaction.date),
                  React.createElement("td", { className: "py-2 px-4" }, transaction.description),
                  React.createElement("td", { className: "py-2 px-4" }, transaction.category),
                  React.createElement(
                    "td",
                    { className: "py-2 px-4" },
                    transaction.type === "transfer" 
                      ? `${transaction.wallet} → ${transaction.transferTo}`
                      : transaction.wallet
                  ),
                  React.createElement(
                    "td",
                    {
                      className: `py-2 px-4 text-right font-medium ${
                        transaction.type === "income" 
                          ? "text-green-500" 
                          : transaction.type === "expense" 
                            ? "text-red-500" 
                            : "text-blue-500"
                      }`
                    },
                    `${transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}¥${transaction.amount.toLocaleString()}`
                  ),
                  React.createElement(
                    "td",
                    { className: "py-2 px-4 text-center" },
                    React.createElement(
                      "button",
                      {
                        onClick: () => deleteTransaction(transaction.id),
                        className: "text-red-500 hover:text-red-700"
                      },
                      "削除"
                    )
                  )
                )
              ) :
              React.createElement(
                "tr",
                null,
                React.createElement(
                  "td",
                  { colSpan: "6", className: "py-4 text-center text-gray-500" },
                  "取引データがありません"
                )
              )
          )
        )
      ),
      transactions.length > 0 &&
        React.createElement(
          "div",
          { className: "mt-4 p-4 bg-gray-100 rounded" },
          React.createElement(
            "div",
            { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
            React.createElement(
              "div",
              null,
              React.createElement("p", { className: "text-sm font-medium" }, "総収入:"),
              React.createElement("p", { className: "text-xl font-bold text-green-500" }, `¥${calculateTotal("income").toLocaleString()}`)
            ),
            React.createElement(
              "div",
              null,
              React.createElement("p", { className: "text-sm font-medium" }, "総支出:"),
              React.createElement("p", { className: "text-xl font-bold text-red-500" }, `¥${calculateTotal("expense").toLocaleString()}`)
            ),
            React.createElement(
              "div",
              null,
              React.createElement("p", { className: "text-sm font-medium" }, "総残高:"),
              React.createElement("p", { className: "text-xl font-bold text-blue-600" }, `¥${calculateTotalBalance().toLocaleString()}`)
            )
          )
        )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(マルチウォレット収支管理アプリ));
