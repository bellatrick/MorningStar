-- Create questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  submitted_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed with existing 34 questions
INSERT INTO questions (id, text, created_at) VALUES
('1', 'What is your biggest red flag, and what is your biggest green flag?', NOW()),
('2', 'What is something you would never tolerate in a relationship?', NOW()),
('3', 'When was the last time you caught feelings unexpectedly?', NOW()),
('4', 'What is your toxic trait when you like someone?', NOW()),
('5', 'Have you ever ghosted someone you actually liked? Why?', NOW()),
('6', 'What is the fastest way someone can lose your interest?', NOW()),
('7', 'What is something you do that would annoy the person dating you?', NOW()),
('8', 'What is your love language when you are obsessed?', NOW()),
('9', 'What kind of attention makes you fold immediately?', NOW()),
('10', 'What is the worst date you have ever been on?', NOW()),
('11', 'Do you fall fast or do you pretend not to?', NOW()),
('12', 'What is something you secretly hope your partner will just get without you saying it?', NOW()),
('13', 'What kind of flirting actually works on you?', NOW()),
('14', 'Have you ever liked two people at the same time?', NOW()),
('15', 'What would make you stop replying mid-talking stage?', NOW()),
('16', 'What is something you are scared to admit when you like someone?', NOW()),
('17', 'What is one question you are afraid I might ask you?', NOW()),
('18', 'What makes you feel calm after a long day?', NOW()),
('19', 'How do you usually show interest when you like someone?', NOW()),
('20', 'What kind of communication drains you fastest?', NOW()),
('21', 'What does a good weekend look like for you?', NOW()),
('22', 'What habit are you trying to drop next year?', NOW()),
('23', 'What topic can you talk about for hours without getting bored?', NOW()),
('24', 'What makes you lose respect for someone quickly?', NOW()),
('25', 'How much alone time do you need to feel balanced?', NOW()),
('26', 'What does consistency mean to you in dating?', NOW()),
('27', 'What part of your life feels most stable right now?', NOW()),
('28', 'What scares you about getting close to someone?', NOW()),
('29', 'What does effort look like to you in a relationship?', NOW()),
('30', 'What kind of future excites you, even if it feels far off?', NOW()),
('31', 'What makes you feel appreciated without words?', NOW()),
('32', 'How do you usually know when something is not right?', NOW()),
('33', 'What is something people often misunderstand about you?', NOW()),
('34', 'What pace feels right for building something real?', NOW());
