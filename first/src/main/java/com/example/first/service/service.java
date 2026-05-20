package com.example.first.service;

import com.example.first.Dto.*;
import com.example.first.entity.*;

import com.example.first.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Map;


@RequiredArgsConstructor
@Service
public class service {

    public final StudentRepo studentRepo;
    public final UserRepo userRepo;
    public final ExpenseRepo expanseRepo;
    public  final InvestmentRepo investmentRepo;
    public final StockRepo stockRepo;
    public  final  GoalTackerRepo goalTackerRepo;


    public List<studentDto> getAllStudent() {
        List<studentEntity> list = studentRepo.findAll();
        return list.stream().map(element -> new studentDto(element.getId(), element.getName(), element.getEmail())).toList();
    }

    public studentDto findById(Long Id) {
        studentEntity student = studentRepo.findById(Id).orElseThrow(() -> new IllegalArgumentException("Student not found"));
        return new studentDto(student.getId(), student.getName(), student.getEmail());
    }

    public studentDto createdNewStudent(createStudentDto addStudent) {
        studentEntity newStudent = new studentEntity();
        newStudent.setName(addStudent.getName());
        newStudent.setName(addStudent.getEmail());
        studentEntity student = studentRepo.save(newStudent);
        return new studentDto(student.getId(), student.getName(), student.getEmail());
    }


    public studentDto updatedStudent(Long id, Map<String, Object> updates) {
        studentEntity student = studentRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Student not found"));

        updates.forEach((key, value) -> {
            switch (key) {
                case "name":
                    student.setName((String) value);
                    break;
                case "email":
                    student.setEmail((String) value);
                    break;
                default:
                    throw new IllegalArgumentException("Field are not exist");
            }

        });

        studentEntity saveStudent = studentRepo.save(student);
        return new studentDto(saveStudent.getId(), saveStudent.getName(), saveStudent.getEmail());

    }

    public UserDto createdNewUser(UserDto addStudent) {
        User newUser = new User();
        newUser.setName(addStudent.getName());
        newUser.setPassword(addStudent.getPassword());
        newUser.setEmail(addStudent.getEmail());
        User user = userRepo.save(newUser);
        return new UserDto(user.getName(), user.getEmail(), user.getPassword());
    }

    public LoginResponseDto loginUser(LoginDto dto) {

        User user = userRepo.findByEmail(dto.getEmail());

        if (user == null) {

            return new LoginResponseDto(
                    false,
                    null,
                    null,
                    "Email not found"
            );
        }

        if (!user.getPassword().equals(dto.getPassword())) {

            return new LoginResponseDto(
                    false,
                    user.getUserId(),
                    user.getName(),
                    "Wrong password"
            );
        }
       return new LoginResponseDto(
               true,
               user.getUserId(),
               user.getName(),
               "Login Successful"
       );

    }

    public ExpanseDto createExpanse( ExpanseDto ex) throws Exception {
        User us = userRepo.findById(ex.getUserId())
                .orElseThrow(() -> new Exception("User not found"));

        Expense expense = new Expense();

        expense.setTitle(ex.getTitle());
        expense.setAmount(ex.getAmount());
        expense.setCategory(ex.getCategory());
        expense.setExpenseDate(ex.getExpenseDate());

        expense.setUsertemp(us);

        Expense savedExpense =expanseRepo.save(expense);

        return new ExpanseDto(savedExpense.getExpenseId(),
                savedExpense.getTitle(),
                savedExpense.getAmount(),
                savedExpense.getCategory(),
                savedExpense.getExpenseDate(),
                savedExpense.getUsertemp().getUserId());




  }





    public InvestmentDto Investment(InvestmentDto ex) throws Exception {

        User us = userRepo.findById(ex.getUserId())
                .orElseThrow(() -> new Exception("User not found"));

        // Total credited money
        Double totalCredit = expanseRepo
                .getTotalByCategory(ex.getUserId(), "credited")
                .orElse(0.0);

        // Total debited money
        Double totalDebit = expanseRepo
                .getTotalByCategory(ex.getUserId(), "debited")
                .orElse(0.0);

        // Available balance
        double balance = totalCredit - totalDebit;

        // Check balance
        if(balance < ex.getInvestedAmount())
        {
            throw new Exception("Insufficient Balance");
        }

        // Save Investment
        Investment inv = new Investment();

        inv.setStockName(ex.getStockName());
        inv.setInvestedAmount(ex.getInvestedAmount());
        inv.setQuantity(ex.getQuantity());
        inv.setRiskPercent(ex.getRiskPercent());
        inv.setInvestmentDate(ex.getInvestmentDate());

        inv.setUsertemp(us);

        Investment savedInvestment = investmentRepo.save(inv);

        // Create Expense
        ExpanseDto expanseDto = new ExpanseDto();

        expanseDto.setTitle("Buy Stock " + ex.getStockName());
        expanseDto.setAmount(ex.getInvestedAmount());
        expanseDto.setCategory("Stock_Debited");
        expanseDto.setUserId(ex.getUserId());
        expanseDto.setExpenseDate(ex.getInvestmentDate());

        createExpanse(expanseDto);

        return new InvestmentDto(
                savedInvestment.getStockName(),
                savedInvestment.getInvestedAmount(),
                savedInvestment.getQuantity(),
                savedInvestment.getRiskPercent(),
                savedInvestment.getInvestmentDate(),
                savedInvestment.getUsertemp().getUserId()
        );
    }
    public void StockAdd( ExpanseDto ex) throws Exception {


        Stock st  = new Stock();
       st.setCompanyName("ABC");
       st.setStockPrice((double)2000);
       st.setRiskPercent(12.34);
        stockRepo.save(st);






    }


    public GoalTacker addGoal(GoalTrackerDto dto) throws Exception {

        User user = userRepo.findById(dto.getUserId())
                .orElseThrow(() -> new Exception("User not found"));

       GoalTacker goal = new GoalTacker();

        goal.setTargetAmount(dto.getTargetAmount());
        goal.setUsertemp(user);

        return goalTackerRepo.save(goal);
    }

    public GetGoalTackerDto getGoalTracker(Long userId) throws Exception {

        Double totalCredit = expanseRepo
                .getTotalByCategory(userId, "credited")
                .orElse(0.0);

        // Total debited money
        Double totalDebit = expanseRepo
                .getTotalByCategory(userId, "debited")
                .orElse(0.0);

        // Available balance
        Double totalStockDebit = expanseRepo
                .getTotalByCategory(userId, "Stock_debited")
                .orElse(0.0);
        double balance = totalCredit - totalDebit + totalStockDebit;

        // Get Goal
        GoalTacker goal = goalTackerRepo
                .findByUsertemp_Id(userId)
                .orElseThrow(() -> new Exception("Goal not found"));

        int targetAmount = goal.getTargetAmount();

        // Calculate Progress %
        Double progress = (balance / targetAmount) * 100;

        // DTO
        GetGoalTackerDto dto = new GetGoalTackerDto();
        dto.setTotalAmount(balance);
        dto.setTargetAmount(targetAmount);
        dto.setProgressPercentage(progress);

        return dto;


    }


    public List<Stock> getStockByRisk(int risk) throws Exception {

        List<Stock> stocks = stockRepo.findStockByRisk(risk);

        if (stocks.isEmpty()) {
            throw new Exception("No stock found for this risk%");
        }

        return stocks;
    }







}
