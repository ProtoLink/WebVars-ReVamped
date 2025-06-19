```markdown
## 🔄 Variable System Updates

### ✨ Anonymous Access & "Anyone" Variables
- **Anonymous Usage**: Variables can now be accessed without authentication using `?userId=<identifier>` parameter
- **"Anyone" Badge**: Variables with public read AND write permissions display an "Anyone" badge in the dashboard
- **Permission Toggle**: Added "Anyone Access" toggle in create/edit forms for easy public variable setup
- **Multi-User Values**: Each userId maintains separate values for the same variable
- **Permission Enforcement**: Read/write operations respect variable-level permissions for anonymous users

### 🏷️ Enum Value Storage & Conversion
- **Human-Readable Storage**: Enum values now stored as readable names in database (e.g., "Transparent", "Additive")
- **Smart API Conversion**: 
  - JSON responses return enum names for readability
  - Text/plain responses return numeric indices for external integration compatibility
- **Flexible Input**: Accepts both numeric indices and enum names as input
- **Dashboard Display**: Variable editor and table show actual enum names instead of numbers
- **Backward Compatibility**: Legacy numeric values still supported and converted automatically

### 🛡️ Enhanced Data Handling
- **Plaintext Storage**: All non-enum values stored exactly as received (no JSON parsing/modification)
- **Special Character Support**: Handles JSON-like strings, special characters, and any plaintext content
- **Type Safety**: Enum conversion only applies to variables with `type: 'enum'` and valid `enumType`
- **Error Prevention**: Robust validation prevents invalid enum conversions

### 🔧 Technical Improvements
- **Resonite Compatibility**: Maintains numeric API responses for game engine integration
- **Permission System**: Granular read/write/list permissions with "anyone" and "variable_owner" levels
- **Real-time Updates**: WebSocket notifications for variable changes across all connected clients
- **Value Persistence**: Anonymous user values persist across sessions using userId parameter
```