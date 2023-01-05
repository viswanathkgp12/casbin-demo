const casbin = require('casbin');
const { Sequelize } = require('sequelize');

class CustomAdapter {
    constructor() {
        this.filtered = true;
        this.sequelize = new Sequelize(
            'propine_development',
            'postgres',
            undefined,
            {
                host: '127.0.0.1',
                port: 5432,
                dialect: 'postgres',
                define: {
                    underscored: true,
                },
                dialectOptions: {
                    connectTimeout: 60000,
                },
                logQueryParameters: false,
                logging: false,
                minifyAliases: true,
            }
        );
    }

    isFiltered() {
        return this.filtered;
    }

    async loadPolicy(model) {
        console.log('')
    }

    async loadFilteredPolicy(model, filter) {
        console.log("load filtered policy ...", filter);
        const [policies, _] = await this.query(`select * from users_permissions up join permissions p on p.id = up.permission_id join resources r on r.id = p.resource_id where up.user_id = '${filter.user_id}' and r."name" = '${filter.resource}'`);
        policies.forEach(policy => {
            const resource_values = policy.filter.value
            const result =
                'p' +
                ', ' +
                [policy.user_id, resource_values[0], policy.privilege, 'allow']
                    .filter((n) => n)
                    .join(', ');
            casbin.Helper.loadPolicyLine(result, model)
        });
    }

    async query(sql) {
        // Execute a raw SQL query against the database
        // ...
        return this.sequelize.query(sql)
    }
}


async function main() {
    // Initialize the Casbin enforcer with the custom adapter
    const filter = { user_id: '9a0b1a76-ab5e-4ec9-a6c3-454f0c92747f', resource: 'cryptocurrency_wallets', value: '7ce1bc5f-89e4-41d5-b155-aa4c5cfb64d5' }
    const adapter = new CustomAdapter();

    const enforcer = await casbin.newEnforcer(`${__dirname}/model.conf`, adapter);

    // Load the policies from the database and enforce them
    await enforcer.loadFilteredPolicy(filter)

    // Use the enforcer as usual to check whether a user has a certain permission
    const allowed = await enforcer.enforce('9a0b1a76-ab5e-4ec9-a6c3-454f0c92747f', '7ce1bc5f-89e4-41d5-b155-aa4c5cfb64d5', 'GET');
    console.log("decision: ", allowed);
    if (!allowed) {
        const policies = await enforcer.getFilteredPolicy("", '')
        console.log(policies)
    }
}

main()


