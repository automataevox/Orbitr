# PostgreSQL Extension for Orbitr

PostgreSQL is a powerful, open source object-relational database system with over 35 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.

## Features

- **Reliable**: ACID compliant with proven architecture
- **Powerful**: Advanced data types and performance optimization
- **Extensible**: Custom functions, data types, and procedural languages
- **Standards Compliant**: SQL standard compliant

## Configuration

### Database User
The superuser name for your PostgreSQL instance. Default: `postgres`

### Database Password
A strong password for the database superuser. **Required** - minimum 8 characters.

### Default Database
The name of the default database that will be created on first startup. Default: `orbitr`

### Host Port
The port on your host machine where PostgreSQL will be accessible. Default: `5432`

## Connection String

After installation, you can connect to your PostgreSQL database using:

```
postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${PORT}/${POSTGRES_DB}
```

## Tools

### psql (Command-line)

Connect to your database using the `psql` command-line tool:

```bash
docker exec -it <container-name> psql -U postgres
```

### pgAdmin (Web UI)

Consider installing the pgAdmin extension for a web-based management interface.

## Backup

Use `pg_dump` to back up your database:

```bash
docker exec <container-name> pg_dump -U postgres dbname > backup.sql
```

## Restore

Restore from a backup:

```bash
docker exec -i <container-name> psql -U postgres dbname < backup.sql
```

## Performance Tips

1. **Shared Buffers**: Typically 25% of system RAM
2. **Work Memory**: Set based on query complexity
3. **Maintenance Work Memory**: For VACUUM and CREATE INDEX
4. **Effective Cache Size**: Should be 50-75% of system RAM

## Security

- Always use a strong password
- Consider running PostgreSQL on a non-default port
- Use network isolation (don't expose to public internet)
- Regular backups are essential

## Official Documentation

For more information, visit the [official PostgreSQL documentation](https://www.postgresql.org/docs/).

## Support

- [PostgreSQL Community](https://www.postgresql.org/community/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/postgresql)
- [Orbitr Discord](https://discord.gg/orbitr)

## License

PostgreSQL License (similar to MIT/BSD)
