import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

const seedTeams = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/focus-forge');
    console.log('Connected to MongoDB');

    // Clear existing teams
    await Team.deleteMany({});
    console.log('Cleared existing teams');

    // Create sample teams
    const teams = [
      {
        name: 'Équipe Design',
        description: 'Équipe responsable du design et de l\'interface utilisateur',
        members: [
          {
            email: 'marie.dupont@email.com',
            firstName: 'Marie',
            lastName: 'Dupont',
            phone: '+33 6 12 34 56 78',
            role: 'admin',
            projectCount: 2,
          },
          {
            email: 'sophie.bernard@email.com',
            firstName: 'Sophie',
            lastName: 'Bernard',
            phone: '+33 6 98 76 54 32',
            role: 'member',
            projectCount: 2,
          },
        ],
      },
      {
        name: 'Équipe Backend',
        description: 'Équipe responsable du développement backend',
        members: [
          {
            email: 'jean.martin@email.com',
            firstName: 'Jean',
            lastName: 'Martin',
            phone: '+33 6 98 76 54 32',
            role: 'admin',
            projectCount: 1,
          },
          {
            email: 'lucas.petit@email.com',
            firstName: 'Lucas',
            lastName: 'Petit',
            role: 'member',
            projectCount: 1,
          },
        ],
      },
      {
        name: 'Équipe Frontend',
        description: 'Équipe responsable du développement frontend',
        members: [
          {
            email: 'alice.durand@email.com',
            firstName: 'Alice',
            lastName: 'Durand',
            phone: '+33 6 11 22 33 44',
            role: 'admin',
            projectCount: 3,
          },
          {
            email: 'bob.moreau@email.com',
            firstName: 'Bob',
            lastName: 'Moreau',
            role: 'member',
            projectCount: 2,
          },
        ],
      },
    ];

    await Team.insertMany(teams);
    console.log(`${teams.length} teams created successfully`);

    // Display created teams
    const allTeams = await Team.find();
    console.log('\nCreated Teams:');
    allTeams.forEach((team) => {
      console.log(`\n- ${team.name} (${team.members.length} members)`);
      team.members.forEach((member) => {
        console.log(`  • ${member.firstName} ${member.lastName} (${member.email})`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding teams:', error);
    process.exit(1);
  }
};

seedTeams();
