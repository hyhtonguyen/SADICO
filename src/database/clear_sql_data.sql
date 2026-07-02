USE [SADICO_P1];
GO

SET NOCOUNT ON;

-- Disable FK checks temporarily for clean delete
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql += N'DELETE FROM ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N';' + CHAR(13) + CHAR(10)
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = N'dbo'
  AND t.name NOT IN (N'__EFMigrationsHistory');

EXEC sys.sp_executesql @sql;
GO

EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL';
GO

PRINT 'All data cleared from SADICO_P1 tables.';
GO
