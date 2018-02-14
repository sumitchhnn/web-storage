(function() {
	class LocalStorage
	{
		constructor() {
			if(typeof(localStorage) === undefined){
				throw 'Storage is not supported';
			}
		}
		setData(key, value) {
			localStorage.setItem(key, value);
		}
		getData(key) {
			let property =  this.exists(key);
			if(property) {
				return localStorage.getItem(key);
			}
			else {
				return null;
			}
		}
		exists(key) {
			if(localStorage.getItem(key)) {
				return true;
			}
			else {
				return false;
			} 	
		}
		delete(key) {
			localStorage.removeItem(key);
		}
		deleteAll() {
			localStorage.clear();
		}
	}

	class SessionStorage {
		constructor() {
			if(typeof(sessionStorage) === undefined){
				throw 'Storage is not supported';
			}
		}

		setSessionData(key, value) {
			sessionStorage.setItem(key, value);
		}

		getSessionData(key) {
			if(isExists(key)){
				sessionStorage.getItem(key);
			} else {
				return ": Value doesn't exists in Session : ";
			}
		}

		isExists(key) {
			let property = sessionStorage.getItem(key);
			if(property) {
				return true;				
			} else {
				return false;
			}
		}

		deleteSessionData(key) {
			if(isExists(key)) {
				sessionStorage.removeItem(key);
			} else {
				return ": Value doesn't exists in Session : ";
			}
		}

		deleteAllSessionData() {
			sessionStorage.clear();
		}
	}
	class IndexedDB {
		constructor(dbConfig, indexValue) {
			let that = this;
			that.records = [];
			this.dbName = 'web-storage';
			this.dbVersion = 1;
         	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
         	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
         	let request = window.indexedDB.open(this.dbName.toString(), this.dbVersion);
         
         	request.onerror = event => {
            	console.log("error: ");
         	};
         
         	request.onsuccess = event => {
         		that.db =  request.result;
            	that.useDatabase(that.db);
            	return;
         	};
         
         	request.onupgradeneeded = function(event) {
            	let db = event.target.result;
            	let objectStore = db.createObjectStore(that.dbName, {keyPath: "id", autoIncrement: true});
            	if(indexValue !== undefined) {
            		for(let key of indexValue) {
	            		objectStore.createIndex(key, key, {"unique" : false});
	            	}
            	}
            	that.useDatabase(db);
         	}
         	request.onblocked = function(event) {
			  	alert("Please close all other tabs with this site open!");
			};
		}

		getObjectStore(storeName, mode) {
			let transaction = this.db.transaction(storeName,  mode);
			return transaction.objectStore(storeName);
		}

		insertRecord (record) {
			let transaction = this.db.transaction(this.dbName, 'readwrite');
			let store = transaction.objectStore(this.dbName);
			store.add(record);
		}

		readRecord(key) {
			let objectStore = this.getObjectStore(this.dbName, 'readonly');
			if(this.verifyObjectStore(objectStore)) { 
				let records =  objectStore.get(key);
				records.onsuccess = this.successReturn;
			}
		}

		readAllRecord() {
			let objectStore = this.getObjectStore(this.dbName, 'readonly');
			if(this.verifyObjectStore(objectStore)) {
				let records =  objectStore.getAll();
				records.onsuccess = this.successReturn;
			}
		}

		removeRecord(key) {
			let objectStore = this.getObjectStore(this.dbName, 'readwrite');
			if(this.verifyObjectStore(objectStore)) { 
				objectStore.delete(key);
			}
		}

		removeAllRecords() {
			let objectStore = this.getObjectStore(this.dbName, 'readwrite');
			if(this.verifyObjectStore(objectStore)) {
				objectStore.clear();	
			}
		}

		updateRecord(key, updatedValue) {
			let objectStore = this.getObjectStore(this.dbName, 'readwrite');
			if(this.verifyObjectStore(objectStore)) {
				objectStore.get(key).onsuccess = function(event) {
					let result = updatedValue;
					objectStore.put(result);
				}
			}

		}

		useDatabase(database) {
			database.onversionchange = function(event) {
			    database.close();
			    alert("A new version of this page is ready. Please reload!");
			};
		}

		verifyObjectStore(objectStore) {
			if(typeof objectStore === 'undefined') {
				return false
			}
			return true;
		}

		successReturn(event) {
			this.records = event.target.result;
			console.log(this.records);
		}
	}
	class SqlQuery {

		constructor() {}

		static createSQlCreateQuery(queryConfig) {
			let sqlquery = new SqlQuery();
			let createSyntax = "CREATE TABLE IF NOT EXISTS " + queryConfig.tableName;
			let columns = '';
			for(let config of queryConfig.columnsToCreate) {
				columns += columns === '' ? config.columnName + " " + config.dataType + "(" + config.size + ") " + sqlquery.extractConstraints(config.constraints) : 
									"," +config.columnName + " " + config.dataType + "(" + config.size + ") " + sqlquery.extractConstraints(config.constraints);
			}
			return createSyntax + "(id INTEGER PRIMARY KEY AUTOINCREMENT," + columns + ");"; 
		}

		static createInsertQuery(queryConfig) {
			let insertSyntax = "INSERT INTO " + queryConfig.tableName;
			let columnValue = '';
			let values = '';
			for(let column of queryConfig.columns) {
				columnValue += columnValue === '' ? column.columnName : ',' + column.columnName;
				values += values === '' ? "'"+column.value + "'" : ",'" + column.value+"'";
			}
			return insertSyntax + " (" + columnValue + ") values(" + values + ")";
		}

		static createSelectQuery(queryConfig) {
			let sqlquery = new SqlQuery();
			let query = '';
			let functions = '';
			if(queryConfig.functions !== '') {
				functions = sqlquery.extractFunctions(queryConfig.functions);
			}
			let selectedColumns = queryConfig.columns === '' ? "SELECT * " + functions : "SELECT " + functions + " " + queryConfig.columns;
			if(queryConfig.clauses !== '') {
				query =  selectedColumns + " FROM " + queryConfig.tableName + sqlquery.extractClauses(queryConfig.clauses);
			} else {
				query = selectedColumns + " FROM " + queryConfig.tableName;
			}
			return query; 
		}

		static createUpdateQuery(queryConfig) {
			let sqlquery = new SqlQuery();
			let query = 'UPDATE ' + queryConfig.tableName + " set ";
			for(let updateSet of queryConfig.updatesToBeDone) {
				query += " " + updateSet.columnName + " = '" + updateSet.value + "'";
			}
			let conditions = sqlquery.extractClauses(queryConfig.conditions); 
			if(conditions !== '') {
				query + " " + conditions;
			}
			return query;
		}

		static createDeleteQuery(queryConfig) {
			let query = 'DELETE FROM ' + queryConfig.tableName;
			let deleteCondition = '';
			if(queryConfig.conditions) {
				for(let condition of queryConfig.conditions) {
					deleteCondition += " " + condition.columnName + " " + condition.condition + " '" + condition.value + "'"; 
				}
				return query + " WHERE " + deleteCondition;
			}
		}

		static createDropQuery(queryConfig) {
			return "DROP " + queryConfig.dropping + " " + queryConfig.name;
		}

		static createAlterQuery(queryConfig) {
			let query = '';
			if(queryConfig.alter.key.toLowerCase() === 'modify') {
				query =	"ALTER TABLE " + queryConfig.tableName  + " " + queryConfig.alter.key + " COLUMN " + queryConfig.alter.columnName + " " + queryConfig.alter.dataType + 
						" (" + queryConfig.alter.size + ")";
			} else if(queryConfig.alter.key.toLowerCase() ===  'rename') {
				query =	"ALTER TABLE " + queryConfig.tableName  + " " + queryConfig.alter.key + " COLUMN '" + queryConfig.alter.columnName + "' TO '" + queryConfig.alter.value + "' " + 
						queryConfig.alter.datatype + " (" + queryConfig.alter.size + ")";
			} else {
				query =	"ALTER TABLE " + queryConfig.tableName  + " " + queryConfig.alter.key + " " + queryConfig.alter.columnName + " " + queryConfig.alter.datatype + 
						" (" + queryConfig.alter.size + ")";
			}
			return query;
		}

		extractFunctions(functions) {
			let queryFunctions = '';
			for(let selectFunction of functions) {
				if(selectFunction.functionName !== '' || selectFunction.value !== '') {
					queryFunctions += " " + selectFunction.functionName + " " + selectFunction.value;
				}
			}
			return queryFunctions;	
		}

		extractConstraints(constraints) {
			let constraintString = '';
			for( let constraint of constraints) {
				if(constraint !== '') {
					constraintString += ' '+ constraint;
				}
			}
			return constraintString;
		}

		extractClauses(clauses) {
			let clauseInSelect = '';
			for(let clause of clauses) {
				if(clause.clause !== ''  || clause.conditionColumn !== '' || clause.value !== '') {
					clauseInSelect += " " + clause.clause + " " + clause.conditionColumn + " " + clause.condition + "  '" + clause.value + "'"; 
				}
			}
			return clauseInSelect;
		}
	}
	class WebSql extends SqlQuery {

		constructor(dbConfig) {
			super();
			this.database = this.createDatabase(dbConfig);
		}

		createDatabase(dbConfig) {
			return openDatabase(dbConfig.name, dbConfig.version, dbConfig.description, dbConfig.size);
		}

		createTable(queryConfig) {
			let query = '';
			if(typeof(queryConfig) === 'object'){
				query = SqlQuery.createSQlCreateQuery(queryConfig);
			} else {
				query = queryConfig;
			}
			this.database.transaction((event) => {
				this.executeTransaction(event, query);
			});
		}

		insertIntoTabel(queryConfig) {
			let query = '';
			if(typeof(queryConfig) === 'object'){
				query = SqlQuery.createInsertQuery(queryConfig);
			} else {
				query = queryConfig;
			}
			this.database.transaction((event) => {
				this.executeTransaction(event, query);
			});
		}

		selectRecords(queryConfig) {
			let query = '';
			if(typeof(queryConfig) === 'object'){
				query = SqlQuery.createSelectQuery(queryConfig);
			} else {
				query = queryConfig;
			}
			this.database.transaction((event) => {
				this.executeTransaction(event, query);
			});
		}

		updateRecord(queryConfig) {
			let query = '';
			if(typeof(queryConfig) === 'object'){
				query = SqlQuery.createUpdateQuery(queryConfig);
			} else {
				query = queryConfig;
			}
			this.database.transaction((event) => {
				this.executeTransaction(event, query);
			});
		}

		deleteRecord(queryConfig) {
			let query = '';
			if(typeof(queryConfig) === 'object'){
				query = SqlQuery.createDeleteQuery(queryConfig);
			} else {
				query = queryConfig;
			}
			this.database.transaction((event) => {
				this.executeTransaction(event, query);
			});
		}

		drop(queryConfig) {
			let query = '';
			if(typeof(queryConfig) === 'object'){
				query = SqlQuery.createDropQuery(queryConfig);
			} else {
				query = queryConfig;
			}
			this.database.transaction((event) => {
				this.executeTransaction(event, query);
			});
		}

		truncateTable(tableName) {
			this.database.transaction((event) => {
				this.executeTransaction(event, "TRUNCATE TABLE" + tableName);
			});
		}

		alterTable(queryConfig) {
			let query = '';
			if(typeof(queryConfig) === 'object'){
				query = SqlQuery.createAlterQuery(queryConfig);
			} else {
				query = queryConfig;
			}
			this.database.transaction((event) => {
				this.executeTransaction(event, query);
			});
		}

		executeTransaction(event, query) {
			try {
				event.executeSql(query , [], this.resultHandler, this.errorHandler);
			} catch(e) {
				throw (e);
			}
		}

		errorHandler (event, error) {
		  	throw (error.message);
		  	return true;  
		}

		resultHandler(event, result) {
			console.log(result.rows);
		}
	}
	class Storage extends WebSql
	{
		constructor(name)
		{
			super(name);
		}
	}
	window.Storage = Storage;
})();