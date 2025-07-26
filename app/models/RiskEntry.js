module.exports = (sequelize, DataTypes) => {
  const RiskEntry = sequelize.define('RiskEntry', {
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  RiskEntry.associate = (models) => {
    RiskEntry.belongsTo(models.Group, { as: 'group', foreignKey: 'groupId' });
    RiskEntry.belongsTo(models.RiskGame, { as: 'game', foreignKey: 'gameId' });
  };

  return RiskEntry;
};
