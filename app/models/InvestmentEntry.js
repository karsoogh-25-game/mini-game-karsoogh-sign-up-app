module.exports = (sequelize, DataTypes) => {
  const InvestmentEntry = sequelize.define('InvestmentEntry', {
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  InvestmentEntry.associate = (models) => {
    InvestmentEntry.belongsTo(models.Group, { as: 'group', foreignKey: 'groupId' });
    InvestmentEntry.belongsTo(models.InvestmentGame, { as: 'game', foreignKey: 'gameId' });
  };

  return InvestmentEntry;
};
