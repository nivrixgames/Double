class ConnectDB {

    //Funcao para conectar ao banco de dados:
    async connect() {
        try {
            const dotenv = require("dotenv")
            dotenv.config()

            if (global.connection)
                return global.connection.connect();

            const { Pool } = require('pg');
            const pool = new Pool({
                user: process.env.PGUSER,
                host: process.env.PGHOST,
                database: process.env.PGDATABASE,
                password: process.env.PGPASSWORD,
                port: process.env.PGPORT
            });

            //Apenas testando a conexão.
            const client = await pool.connect();
            console.log("Criou pool de conexões no PostgreSQL!");
            client.release();

            //Guardando para usar sempre o mesmo.
            global.connection = pool;
            return pool.connect();
        } catch (error) {
            console.error('Erro ao conectar ao banco de dados: ', error);
            throw error;
        }
    }

    //Funcao para inserir um novo registro para um novo jogo no banco de dados: OK!
    async insertCustomer() {
        try {
            const resultValues = await this.getCurrentIdAndCurrentTotalBet();
            let id = resultValues.map(objeto => objeto.id);
            id = parseFloat(id[id.length - 1]) + 1;

            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateFormated = `${year}-${month}-${day}`;

            const client = await this.connect();
            const sql = 'INSERT INTO game(id, total_bet, color, color_number, game_date) VALUES ($1, $2, $3, $4, $5);';
            const values = [id, 0, '', 0, dateFormated];
            return await client.query(sql, values);
        } catch (error) {
            console.error('Erro ao inserir uma novo registro inicial ao banco: ', error);
            throw error;
        }
    }


    //Funcao para dar update e somar aposta ao banco de dados: OK!
    async setBet(betValue) {
        const resultValues = await this.getCurrentIdAndCurrentTotalBet();
        let currentId = resultValues.map(objeto => objeto.id);
        let current_bet = resultValues.map(objeto => objeto.total_bet);
        currentId = currentId[currentId.length - 1];
        let total_bet = parseFloat(betValue) + parseFloat(current_bet[current_bet.length - 1]);
        try {
            const client = await this.connect();
            const sql = 'UPDATE game SET total_bet = $1 WHERE id = $2;';
            const values = [total_bet, currentId];
            return await client.query(sql, values);
        } catch (error) {
            console.error('Erro ao atualizar dinheiro das apostas!');
            throw error;
        }
    }

    //Funcao final que da update da cor e numero resultante ao final da partida: OK!
    async endSet(color, colorNumber) {
        const resultValues = await this.getCurrentIdAndCurrentTotalBet();
        let currentId = resultValues.map(objeto => objeto.id);
        currentId = currentId[currentId.length - 1];
        try {
            const client = await this.connect();
            const sql = 'UPDATE game SET color = $1, color_number = $2 WHERE id = $3;';
            const values = [color, colorNumber, currentId];
            await client.query(sql, values);
        } catch (error) {
            console.error('Erro ao atualizar a tabela game:', error);
            throw error;
        }
        return this.insertCustomer();
    }

    //Funcao para obter os dados da tabela:
    async getCurrentIdAndCurrentTotalBet() {
        try {
            const client = await this.connect();
            const res = await client.query('SELECT id, total_bet FROM game');
            return res.rows;
        } catch (error) {
            console.error('Erro na funcao para obter os dados da tabela do banco de dados: ', error);
            throw error;
        }
    }

    //Funcao para obter os dados da tabela:
    async getStats() {
        try {
            const client = await this.connect();
            const res = await client.query('SELECT * FROM game');
            return res.rows;
        }catch(error){
            console.error('Erro ao obter os dados da tabela', error);
            throw error;
        }
    }

}

module.exports = ConnectDB;
