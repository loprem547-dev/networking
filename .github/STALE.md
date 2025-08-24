# Stale Issue Configuration

This file configures how GitHub handles stale issues and pull requests.

## Stale Issue Rules

### Issues
- **Days until stale**: 30 days
- **Days until close**: 7 days after stale
- **Labels to add when stale**: `stale`
- **Labels to remove when stale**: `enhancement`, `help wanted`, `good first issue`

### Pull Requests
- **Days until stale**: 30 days
- **Days until close**: 7 days after stale
- **Labels to add when stale**: `stale`
- **Labels to remove when stale**: `help wanted`, `good first issue`

## Stale Message

When an issue or PR becomes stale, the following message is added:

```
This issue has been automatically marked as stale because it has not had recent activity. It will be closed if no further activity occurs. Thank you for your contributions.
```

## Close Message

When a stale issue or PR is closed, the following message is added:

```
This issue has been automatically closed due to inactivity. If you believe this issue is still relevant, please feel free to reopen it with additional context.
```

## Exemptions

The following labels exempt issues and PRs from becoming stale:
- `pinned`
- `security`
- `documentation`
- `bug`
- `critical`

## Configuration

This configuration is managed by GitHub's Stale Bot and can be customized in the repository settings.

## Benefits

- Keeps the issue tracker clean and organized
- Encourages timely responses and updates
- Reduces noise from abandoned issues
- Maintains project momentum

## Manual Override

Repository maintainers can manually override stale status by:
- Adding exempt labels
- Commenting on the issue/PR
- Updating the issue/PR

## Best Practices

1. **Regular Review**: Review stale issues weekly
2. **Quick Response**: Respond to new issues within 48 hours
3. **Clear Labels**: Use appropriate labels for categorization
4. **Timely Updates**: Update issues when progress is made
5. **Community Engagement**: Encourage community participation 