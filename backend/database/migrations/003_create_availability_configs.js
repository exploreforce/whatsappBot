exports.up = function(knex) {
  return knex.schema.createTable('availability_configs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('(hex(randomblob(16)))'));
    table.text('weekly_schedule').notNullable(); // JSON string
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('availability_configs');
}; 