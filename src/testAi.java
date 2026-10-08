import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

public class testAi {
    public static void main(String[] args) {
        User firstUser = new User("Иванов", "Иван", 20);
        User secondUser = new User("Петров", "Оксана", 17);
        User thirdUser = new User("Сидоров", "Анна", 8);

        Map<String, User> users = new LinkedHashMap<>();
        users.put(firstUser.getSurname(), firstUser);
        users.put(secondUser.getSurname(), secondUser);
        users.put(thirdUser.getSurname(), thirdUser);

        for (User user : users.values()) {
            user.checkAge();

            try {
                user.checkName();
            } catch (NameContainsCException exception) {
                System.out.println(exception.getMessage());
            }
        }

        for (User user : users.values()) {
            if (user.getAge() < 10) {
                System.out.println("Ты ребенок");
            }
        }
    }

    private static class User {
        private final String surname;
        private final String name;
        private final int age;

        private User(String surname, String name, int age) {
            this.surname = surname;
            this.name = name;
            this.age = age;
        }

        private String getSurname() {
            return surname;
        }

        private int getAge() {
            return age;
        }

        private void checkAge() {
            if (age < 18) {
                System.out.println("Ты малой");
            } else {
                System.out.println("Проходите");
            }
        }

        private void checkName() throws NameContainsCException {
            if (name.toLowerCase(Locale.ROOT).contains("с")) {
                throw new NameContainsCException("У тебя есть С ты не проходишь");
            }
        }
    }

    private static class NameContainsCException extends Exception {
        private NameContainsCException(String message) {
            super(message);
        }
    }
}
