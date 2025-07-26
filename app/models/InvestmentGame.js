module.exports = (sequelize, DataTypes) => {
  const InvestmentGame = sequelize.define('InvestmentGame', {
    threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    multiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    totalInvested: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });

  InvestmentGame.associate = (models) => {
    InvestmentGame.hasMany(models.InvestmentEntry, { as: 'entries', foreignKey: 'gameId' });
  };

  return InvestmentGame;
};
