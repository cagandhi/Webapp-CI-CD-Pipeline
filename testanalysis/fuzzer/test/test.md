{NumberQuestions:false}
-----------
In this study, we assess how program-committee members of journals and
conferences in the software-engineering domain think about empirical
research.

### Introduction
The Future of Empirical Research in Software Engineering
In software engineering, empirical studies became more and more
important, especially over the past few years. Empirical studies come
with several obstacles. In this questionnaire, we are interested in
the **validity** of empirical studies. Typically, two kinds of
validity are of primary concern: internal and external validity.

**Internal validity** is the degree to which the influence of
confounding factors on the results are excluded. This allows
experimenters to observe the results without bias. For example, when
recruiting novice programmers, results are not biased by different
levels of programming experience.

In contrast, **external validity** is the degree to which results of
one experiment can be generalized. For example, when recruiting
programmers with different levels of programming experience, according
experimental results apply to these different levels of programming
experience.

There is a trade-off between internal and external validity; only one
at a time can be maximized. There are different ways to address this
trade off in empirical research, and we would like your thoughts on
this.

-----------

### Program-Committee Activity
Since you are an expert in software engineering, we highly value your
opinion. To help us better understand your answers, we would like to
know for which conferences and journals you served as a reviewer
(technical and research papers). We will anonymize your data.


| Conference      | 2014  | 2013   | 2012  | 2011  | 2010 | Full name |
| ----------------| ----- | ------ |
| ASE     |   []  |  []    |  []   |   []  |  []  | International
Conference on Automated Software Engineering |
| EASE  |   []  |  []    |  []   |   []  |  []  | International
Conference on Evaluation and Assessment in Software Engineering |
| ECOOP  |   []  |  []    |  []   |   []  |  []  | International
Conference on Evaluation and Assessment in Software Engineering |
| EMSE  |   []  |  []    |  []   |   []  |  []  | Empirical Software
Engineering Journal |
| ESEC/FSE  |   []  |  []    |  []   |   []  |  []  | European
Software Engineering Conference/Symposium on the Foundations of
Software Engineering |
| ESEM  |   []  |  []    |  []   |   []  |  []  | International
Symposium on Empirical Software Engineering and Measurement |
| GPCE  |   []  |  []    |  []   |   []  |  []  | International
Conference on Generative Programming: Concepts & Experiences |
| ICPC  |   []  |  []    |  []   |   []  |  []  | International
Conference on Program Comprehension |
| ICSE  |   []  |  []    |  []   |   []  |  []  | International
Conference on Software Engineering |
| ICSM  |   []  |  []    |  []   |   []  |  []  | International
Conference on Software Maintenance |
| OOPSLA  |   []  |  []    |  []   |   []  |  []  | International
Conference on Object-Oriented Programming, Systems, Languages, and
Applications |
| TOSEM  |   []  |  []    |  []   |   []  |  []  | ACM Transactions on
Software Engineering and Methodology |
| TSE  |   []  |  []    |  []   |   []  |  []  | IEEE Transactions on
Software Engineering |

<br/ >
Did we forget some important venue? Let us know which venue and in
which years (starting from 2010) you reviewed papers:

> {rows:7}

-----------

## Scenario
Consider the following scenario: Suppose you are a reviewer of a
submission in which the authors want to determine, based on an
empirical study with human participants, whether functional or
object-oriented programming (FP vs. OOP) is more comprehensible for
programmers. So far, this question has never been addressed. Now,
there are two options to design the study:

**Option 1: maximize internal validity**

The authors develop an artificial language that has a very similar
design in the functional and object-oriented version. They leave out
special features of existing languages (e.g., generics, classes, ...),
recruit students as participants, use a stripped-down IDE, use
artificial tasks to measure program comprehension, etc. In short,
authors exclude the influence of all possible confounding factors.

**Option 2: maximize external validity**

Instead of creating an artificial set-up, the authors use existing
languages, IDEs, and tasks to conduct the experiment. Authors recruit
professional programmers as participants, use real projects from
SourceForge, Eclipse as IDE, and let participants fix real bugs. In
other words, authors create a practical, everyday setting.

### Which option would you prefer for an evaluation?

1. Option 1: maximize internal validity
2. Option 2: maximize external validity
3. No preference

Please, elaborate:
> {rows:7}

### Would it be a reason to reject a paper if it does not choose your
favored option?
1. Yes
2. No

Please, elaborate:
> {rows:7}

### In your opinion, what is the ideal way to address research
questions like the one outlined above (FP vs. OOP)?

> {rows:7}

<hr>
Consider a different research question, not one in which human
participants are observed, but, say, a new approach that promises
faster response times for database systems.

Again, there are the two options for evaluation: maximize internal
(e.g., look at one database system in detail) or maximize external
(e.g., look at as many systems as possible, neglecting system-specific
details) validity.

Assuming that both options would be realized in the best possible way,
which option would you prefer for evaluation like the one outlined
above?
1. Maximize internal validity
2. Maximize external validity

Please, elaborate why you did or did not select a different option
than for Question 1:
> {rows:7}

-----------

## Research Direction

For the following questions, please look back on your activity as a reviewer.

### Did you recommend to reject a paper in the past mainly for the
following reasons?
* Internal validity too low
* External validity too low

Please, elaborate:
> {rows:7}

### For research questions like the one presented above (FP vs. OOP),
do you prefer more practically relevant research or more theoretical
(ground) research?

1. Applied research (focus on practicability)
2. Basic research (focus on sound scientific foundations)
3. No preference

Please, elaborate:
> {rows:7}

### During your reviewer career, have you changed how you judged a
paper regarding internal and external validity?
* Yes, I now appreciate papers with high internal validity more.
* Yes, I now appreciate papers with high external validity more.
* No, I have not changed my view.

Please, elaborate:
> {rows:7}

-----------

## Validity
The following questions are related to the representation of empirical
research in the software-engineering literature.

### In your opinion, do you think that in the literature, empirical
evaluations with human participants...

|  |Considerably less often  | Less often   | Fine as is | More |
Considerably more| I do not know |
| ----------------| ----- | ------ |-----|-----|-----|---|
| **...are needed more or less often?**||||||||
| |   Considerably too often rejected  |   Too often rejected   |
Fine as is   |   Too often accepted  |   Considerably too often
accepted |  I do not know |
| ----------------| ----- | ------ |-----|-----|-----|
|**...are accepted/rejected too often?** ||||||||
| |   Considerably higher internal validity |   Higher internal
validity  |  Fine as is   |  Higher external validity |   Considerably
higher external validity |  I do not know |
| ----------------| ----- | ------ |-----|-----|-----|
|**...need higher internal/ external validity?**||||||||

Please, elaborate: <br />
> {rows:7}

<hr>

### In your opinion, do you think experiments without human
participants (e.g., performance evaluation, code measurement)...

|  |Considerably less often  | Less often   | Fine as is | More |
Considerably more| I do not know |
| ----------------| ----- | ------ |-----|-----|-----|---|
| **...are needed more or less often?**||||||||
| |   Considerably too often rejected  |   Too often rejected   |
Fine as is   |   Too often accepted  |   Considerably too often
accepted |  I do not know |
| ----------------| ----- | ------ |-----|-----|-----|
|**...are accepted/rejected too often?** ||||||||
| |   Considerably higher internal validity |   Higher internal
validity  |  Fine as is   |  Higher external validity |   Considerably
higher external validity |  I do not know |
| ----------------| ----- | ------ |-----|-----|-----|
|**...need higher internal/ external validity?**||||||||

Please, elaborate:
> {rows:7}

-----------

## Replication
To increase validity of empirical studies, researchers replicate
experiments. That is, the same or other researchers conduct the
experiment again, either exactly as it took place, or with some
modifications.

### During your activity as a reviewer, how often have you reviewed a
replicated study?
1. Never
2. Sometimes
3. Regularly

Please, elaborate:
> {rows:7}


### During your activity as a reviewer, did you notice a change in the
number of replicated studies?

1. Yes, it increased.
2. Yes, it decreased.
3. No

Please, elaborate:
> {rows:7}

### Do you think we need to publish more experimental replications in
computer science?

1. Yes
2. No

Please, elaborate:
> {rows:7}


### As a reviewer of a top-ranked conference, would you accept a paper
that, as the main contribution,... (assuming authors realized it in
the best possible way)

||Yes|No|I do not know|
|-|-|-|-|
|**...exactly replicates a previously published experiment of *the
same* group?**||||
|**...exactly replicates a previously published experiment of
*another* group?**||||
|**...replicates a previously published experiment of *the same*
group, but *increases external* validity (e.g., by recruiting expert
programmers or using another programming language)?**||||
|**...replicates a previously published experiment of *another* group,
but *increases external* validity (e.g., by recruiting expert
programmers or using another programming language)?**||||
|**...replicates a previously published experiment of *the same*
group, but *increases internal* validity (e.g., by recruiting expert
programmers or using another programming language)?**||||
|**...replicates a previously published experiment of *another group*,
but increases *internal validity* (e.g., by recruiting expert
programmers or using another programming language)?**||||

### Please, elaborate:
> {rows:7}

-----------

## Concluding Remarks
A huge problem for authors is that empirical evaluations require a
high effort in terms of time and cost (e.g., recruiting participants,
designing tasks, selecting/designing languages). Since the outcome of
an experiment is not clear and might be biased (e.g., due to
deviations), the effort is at high risk.

### What do you think about a reviewing format with several rounds,
but with publication guarantees?

*That is, the paper is guaranteed to be published (independent of the
results), if the authors conduct a further, sound empirical evaluation
that improves either internal or external validity*?

Answer:

> {rows:7}

Do you have any suggestions on how empirical researchers can solve the
dilemma of internal vs. external validity of empirical work in
computer science?

### Answer:

> {rows:7}

### What are possible influencing factors for balancing internal and
external validity

*(e.g., maturity of research area, availability of experimental data,
effort of recruiting and preparing participants/subject systems)*
Answer: <br />
> {rows:7}

### Do you have any additional comments to this survey, questionnaire,
or empirical research in general?

Comments:
> {rows:7}

Thank you very much for your time. If you have any questions regarding
this survey, please contact: <br /> <br />
Janet Siegmund: siegmunj@fim.uni-passau.de<br />
Norbert Siegmund: siegmunn@fim.uni-passau.de<br />
Sven Apel: apel@fim.uni-passau.de<br />
